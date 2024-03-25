import { ActionFunction, json } from "@remix-run/node";
import { Psbt } from "bitcoinjs-lib";
import crypto from "crypto-js";
import dayjs from "dayjs";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { validateInputSignature } from "@/lib/utils/bitcoin-utils";
import { errorResponse } from "@/lib/utils/error-helpers";

const { SHA256 } = crypto;

const Schema = z.object({
  atomicalId: z.string(),
  atomicalNumber: z.number().int().min(0),
  type: z.enum(["realm", "dmitem"]),
  price: z.number(),
  description: z.string().optional(),
  listAccount: z.string(),
  receiver: z.string(),
  unsignedPsbt: z.string(),
  signedPsbt: z.string(),
  tx: z.string(),
  vout: z.number().int().min(0),
  value: z.number().int().min(0),
  realm: z.string().optional(),
  dmitem: z.string().optional(),
  container: z.string().optional(),
});

type SchemaType = z.infer<typeof Schema>;

export const action: ActionFunction = async ({ request }) => {
  try {
    const data: SchemaType = await request.json();

    try {
      Schema.parse(data);
    } catch (e) {
      return json(errorResponse(10001));
    }

    const lockHash = SHA256(
      `${data.atomicalId}:${data.listAccount}`,
    ).toString();

    const exist = await RedisInstance.get(`offer:lock:create:${lockHash}`);

    if (!exist) {
      return json(errorResponse(10005));
    }

    // psbt
    const unsignedPsbt = Psbt.fromHex(data.unsignedPsbt);
    const signedPsbt = Psbt.fromHex(data.signedPsbt);

    // check psbt signatrue
    // only input 0
    if (!validateInputSignature(signedPsbt, 0)) {
      throw new Error(`Invalid signature of input #0`);
    }

    signedPsbt.finalizeInput(0);

    const bid = SHA256(`${data.atomicalId}:${data.tx}:${data.vout}`).toString();

    await DatabaseInstance.$transaction([
      DatabaseInstance.atomical_offer.upsert({
        create: {
          bid,
          atomical_id: data.atomicalId,
          atomical_number: data.atomicalNumber,
          type: data.type === "realm" ? 1 : 2,
          price: data.price,
          description: data.description,
          status: 1,
          list_account: data.listAccount,
          funding_receiver: data.receiver,
          unsigned_psbt: unsignedPsbt.toHex(),
          signed_psbt: signedPsbt.toHex(),
          tx: data.tx,
          vout: data.vout,
          value: data.value,
          create_at: dayjs().unix(),
          update_at: dayjs().unix(),
          realm: data.realm,
          dmitem: data.dmitem,
          container: data.container,
        },
        update: {
          price: data.price,
          description: data.description,
          status: 1,
          funding_receiver: data.receiver,
          unsigned_psbt: data.unsignedPsbt,
          signed_psbt: data.signedPsbt,
          update_at: dayjs().unix(),
        },
        where: {
          bid,
        },
      }),
      data.type === "dmitem"
        ? DatabaseInstance.atomical_dmitem.updateMany({
            data: {
              bid,
            },
            where: {
              atomical_id: data.atomicalId,
            },
          })
        : DatabaseInstance.atomical_realm.updateMany({
            data: {
              bid,
            },
            where: {
              atomical_id: data.atomicalId,
            },
          }),
    ]);

    await RedisInstance.del(`offer:lock:create:${lockHash}`);

    return json({
      data: null,
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

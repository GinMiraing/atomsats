import { ActionFunction, json } from "@remix-run/node";
import crypto from "crypto-js";
import dayjs from "dayjs";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";

const { SHA256 } = crypto;

const Schema = z.object({
  atomicalId: z.string(),
  atomicalNumber: z.number().int().min(0),
  type: z.union([z.literal("realm"), z.literal("dmitem")]),
  price: z.number(),
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

type OfferCreateData = z.infer<typeof Schema>;

export const action: ActionFunction = async ({ request }) => {
  try {
    const data: OfferCreateData = await request.json();

    try {
      Schema.parse(data);
    } catch (e) {
      return json({
        data: null,
        error: true,
        code: 10001,
      });
    }

    try {
      const lockHash = SHA256(
        `${data.atomicalId}:${data.listAccount}`,
      ).toString();

      const exist = await RedisInstance.get(`offer:lock:create:${lockHash}`);

      if (!exist) {
        return json({
          data: null,
          error: true,
          code: 10005,
        });
      }

      const bid = SHA256(
        `${data.atomicalId}:${data.tx}:${data.vout}`,
      ).toString();

      await DatabaseInstance.atomical_offer.upsert({
        create: {
          bid,
          atomical_id: data.atomicalId,
          atomical_number: data.atomicalNumber,
          type: data.type === "realm" ? 1 : 2,
          price: data.price,
          status: 1,
          list_account: data.listAccount,
          funding_receiver: data.receiver,
          unsigned_psbt: data.unsignedPsbt,
          signed_psbt: data.signedPsbt,
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
          funding_receiver: data.receiver,
          unsigned_psbt: data.unsignedPsbt,
          signed_psbt: data.signedPsbt,
          update_at: dayjs().unix(),
        },
        where: {
          bid,
        },
      });

      await RedisInstance.del(`offer:lock:create:${lockHash}`);
    } catch (e) {
      console.log(e);
      throw e;
    }

    return json({
      data: null,
      error: false,
      code: 0,
    });
  } catch (e) {
    return json({
      data: null,
      error: true,
      code: 20001,
    });
  }
};
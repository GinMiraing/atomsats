import { ActionFunction, json } from "@remix-run/node";
import { verifyMessage } from "@unisat/wallet-utils";
import { Verifier } from "bip322-js";
import { networks } from "bitcoinjs-lib";
import crypto from "crypto-js";
import { z } from "zod";

import RedisInstance from "@/lib/server/redis.server";
import { AccountInfo } from "@/lib/types";
import { detectAccountTypeFromScript } from "@/lib/utils/address-helpers";
import { errorResponse } from "@/lib/utils/error-helpers";

const { SHA256 } = crypto;

const Schema = z.object({
  id: z.number().int().min(0),
  event: z.union([z.literal("like"), z.literal("unlike")]),
  account: z.string(),
  pubkey: z.string(),
  script: z.string(),
  signature: z.string(),
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

    const accountScript = Buffer.from(data.script, "hex");
    const account: AccountInfo = {
      address: data.account,
      network: networks.bitcoin,
      type: detectAccountTypeFromScript(accountScript),
      script: accountScript,
      pubkey: Buffer.from(data.pubkey, "hex"),
    };

    const message =
      data.event === "like"
        ? `liked ${SHA256(data.id.toString()).toString()} by ${data.account}`
        : `unliked ${SHA256(data.id.toString()).toString()} by ${data.account}`;

    if (account.type === "p2tr") {
      const validity = Verifier.verifySignature(
        account.address,
        message,
        data.signature,
      );
      if (!validity) {
        return json(errorResponse(10017));
      }
    } else {
      const result = verifyMessage(
        account.pubkey.toString("hex"),
        message,
        data.signature,
      );
      if (!result) {
        return json(errorResponse(10017));
      }
    }

    if (data.event === "like") {
      await Promise.all([
        RedisInstance.sadd(`offer:favors:${data.id}`, data.account),
        RedisInstance.sadd(`account:favors:${data.account}`, data.id),
      ]);
    } else {
      await Promise.all([
        RedisInstance.srem(`offer:favors:${data.id}`, data.account),
        RedisInstance.srem(`account:favors:${data.account}`, data.id),
      ]);
    }

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

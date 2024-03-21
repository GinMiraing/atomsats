import { ActionFunction, json } from "@remix-run/node";
import { Psbt, networks } from "bitcoinjs-lib";
import crypto from "crypto-js";
import { z } from "zod";

import { getElectrumClient } from "@/lib/apis/atomical";
import { isDMINT, isREALM } from "@/lib/apis/atomical/type";
import RedisInstance from "@/lib/server/redis.server";
import { AccountInfo } from "@/lib/types";
import {
  detectAccountTypeFromScript,
  detectAddressTypeToScripthash,
  getInputExtra,
} from "@/lib/utils/address-helpers";
import { errorResponse } from "@/lib/utils/error-helpers";

const { SHA256 } = crypto;

const Schema = z.object({
  atomicalId: z.string(),
  price: z.number().int().min(0),
  listAccount: z.string(),
  script: z.string(),
  pubkey: z.string(),
  receiver: z.string(),
  tx: z.string(),
  vout: z.number().int().min(0),
  value: z.number().int().min(0),
});

type SchemaType = z.infer<typeof Schema>;

export const action: ActionFunction = async ({ request }) => {
  try {
    const electrum = getElectrumClient(networks.bitcoin);
    const data: SchemaType = await request.json();

    try {
      Schema.parse(data);
    } catch (e) {
      return json(errorResponse(10001));
    }

    // check address
    try {
      detectAddressTypeToScripthash(data.listAccount);
      detectAddressTypeToScripthash(data.receiver);
    } catch (e) {
      return json(errorResponse(10012));
    }

    if (data.price < 546) {
      return json(errorResponse(10013));
    }

    const { result } = await electrum.atomicalsGetState(data.atomicalId, true);

    if (!result) {
      return json(errorResponse(10006));
    }

    if (
      (!isREALM(result) && !isDMINT(result)) ||
      result.subtype.includes("request")
    ) {
      return json(errorResponse(10007));
    }

    if (!result.location_info || result.location_info.length === 0) {
      return json(errorResponse(10008));
    }

    const atomicalLocation = result.location_info[0];

    if (
      atomicalLocation.txid !== data.tx ||
      atomicalLocation.index !== data.vout ||
      atomicalLocation.value !== data.value
    ) {
      return json(errorResponse(10008));
    }

    const accountScript = Buffer.from(data.script, "hex");
    const account: AccountInfo = {
      address: data.listAccount,
      network: networks.bitcoin,
      type: detectAccountTypeFromScript(accountScript),
      script: accountScript,
      pubkey: Buffer.from(data.pubkey, "hex"),
    };

    const psbt = new Psbt({ network: networks.bitcoin });

    psbt.addInput({
      hash: data.tx,
      index: data.vout,
      witnessUtxo: {
        script: accountScript,
        value: data.value,
      },
      ...getInputExtra(account),
    });

    psbt.addOutput({
      address: data.receiver,
      value: data.price,
    });

    const hash = SHA256(`${data.atomicalId}:${data.listAccount}`).toString();

    await RedisInstance.set(
      `offer:lock:create:${hash}`,
      "1",
      "EX",
      60 * 30,
      "NX",
    );

    return json({
      data: {
        unsignedPsbt: psbt.toHex(),
      },
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

import { ActionFunction, json } from "@remix-run/node";
import { Psbt, networks } from "bitcoinjs-lib";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { AccountInfo } from "@/lib/types";
import {
  detectAccountTypeFromScript,
  detectAddressTypeToScripthash,
} from "@/lib/utils/address-helpers";
import { coinselect, toOutputScript } from "@/lib/utils/bitcoin-utils";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  offerId: z.number().int().min(0),
  account: z.string(),
  receiver: z.string(),
  script: z.string(),
  pubkey: z.string(),
  gasFeeRate: z.number().int().min(0),
  utxos: z.array(
    z.object({
      txid: z.string(),
      vout: z.number().int().min(0),
      value: z.number().int().min(0),
      script_pubkey: z.string(),
    }),
  ),
});

type OfferBuyData = z.infer<typeof Schema>;

export const action: ActionFunction = async ({ request }) => {
  try {
    const data: OfferBuyData = await request.json();

    try {
      Schema.parse(data);
    } catch (e) {
      return json(errorResponse(10001));
    }

    try {
      detectAddressTypeToScripthash(data.account);
      detectAddressTypeToScripthash(data.receiver);
    } catch (e) {
      return json(errorResponse(10012));
    }

    const offer = await DatabaseInstance.atomical_offer.findFirst({
      where: {
        id: data.offerId,
        status: 1,
      },
    });

    if (!offer) {
      return json(errorResponse(10002));
    }

    const accountScript = Buffer.from(data.script, "hex");
    const account: AccountInfo = {
      address: data.account,
      network: networks.bitcoin,
      type: detectAccountTypeFromScript(accountScript),
      script: accountScript,
      pubkey: Buffer.from(data.pubkey, "hex"),
    };

    const intPrice = parseInt(offer.price.toString());

    if (!Number.isInteger(intPrice)) {
      return json(errorResponse(10014));
    }

    // output_1 => atomical
    // output_2 => funding
    // output_3 => server_fee
    const targets: {
      script: Buffer;
      value: number;
    }[] = [
      {
        script: toOutputScript(data.receiver, networks.bitcoin),
        value: offer.value,
      },
      {
        script: toOutputScript(offer.funding_receiver, networks.bitcoin),
        value: parseInt(offer.price.toString()),
      },
    ];

    // server fee only if price > 60000
    if (intPrice >= 60000) {
      targets.push({
        script: toOutputScript(
          "bc1qmsly4rlgh7nurv46lyqr3sz7wrc7g0ayaltyya",
          networks.bitcoin,
        ),
        value: Math.floor(intPrice * 0.01),
      });
    }

    try {
      const { feeInputs, outputs } = coinselect(
        account,
        data.utxos,
        targets,
        data.gasFeeRate,
        [{ value: offer.value }],
      );

      const psbt = new Psbt({ network: networks.bitcoin });

      const offerPsbt = Psbt.fromHex(offer.unsigned_psbt);

      if (!offerPsbt.txInputs[0] || !offerPsbt.data.inputs[0]) {
        return json(errorResponse(10010));
      }

      psbt.addInput({
        hash: offerPsbt.txInputs[0].hash,
        index: offerPsbt.txInputs[0].index,
        sequence: offerPsbt.txInputs[0].sequence,
        witnessUtxo: offerPsbt.data.inputs[0].witnessUtxo,
      });

      for (const input of feeInputs) {
        psbt.addInput(input);
      }

      for (const output of outputs) {
        psbt.addOutput(output);
      }

      await RedisInstance.set(
        `offer:buy:psbt:unsigned:${offer.bid}`,
        psbt.toHex(),
      );

      return json({
        data: {
          unsignedPsbt: psbt.toHex(),
        },
        error: false,
        code: 0,
      });
    } catch (e) {
      return json(errorResponse(10015));
    }
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

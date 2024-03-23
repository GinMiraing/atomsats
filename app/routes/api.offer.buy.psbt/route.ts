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

const deleteOffer = async (id: number) => {
  await DatabaseInstance.atomical_offer.update({
    data: {
      status: 2,
    },
    where: {
      id,
    },
  });
};

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

type SchemaType = z.infer<typeof Schema>;

export const action: ActionFunction = async ({ request }) => {
  try {
    const data: SchemaType = await request.json();

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

    // build account
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

    const serverFee = Math.floor(intPrice * 0.015);

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
      {
        script: toOutputScript(
          "bc1qmsly4rlgh7nurv46lyqr3sz7wrc7g0ayaltyya",
          networks.bitcoin,
        ),
        value: serverFee >= 1000 ? serverFee : 1000,
      },
    ];

    try {
      const { feeInputs, outputs } = coinselect(
        account,
        data.utxos,
        targets,
        data.gasFeeRate,
        [{ value: offer.value }],
      );

      if (feeInputs.length > 1) {
        throw new Error("Too many fee inputs");
      }

      const psbt = new Psbt({ network: networks.bitcoin });

      try {
        // only use unsigned psbt
        const offerPsbt = Psbt.fromHex(offer.unsigned_psbt);

        if (!offerPsbt.txInputs[0] || !offerPsbt.data.inputs[0]) {
          throw new Error("Invalid PSBT");
        }

        for (const input of feeInputs) {
          psbt.addInput(input);
        }

        // get atomical input
        const atomInput: {
          hash: Buffer;
          index: number;
          script: Uint8Array;
          sequence: number;
          witness: Uint8Array[];
        } = (offerPsbt.data.globalMap.unsignedTx as any).tx.ins[0];

        // add atomical input at last
        psbt.addInput({
          hash: atomInput.hash,
          index: atomInput.index,
          sequence: atomInput.sequence,
          witnessUtxo: offerPsbt.data.inputs[0].witnessUtxo,
          sighashType: offerPsbt.data.inputs[0].sighashType,
        });

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
        console.log(e);
        await deleteOffer(data.offerId);
        return json(errorResponse(10010));
      }
    } catch (e) {
      return json(errorResponse(10015));
    }
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

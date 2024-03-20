import { ActionFunction, json } from "@remix-run/node";
import { Psbt, networks } from "bitcoinjs-lib";
import crypto from "crypto-js";
import dayjs from "dayjs";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { validateInputSignature } from "@/lib/utils/bitcoin-utils";
import { errorResponse } from "@/lib/utils/error-helpers";

const { SHA256 } = crypto;

const Schema = z.object({
  id: z.number().int().min(0),
  signedPsbt: z.string(),
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

    const offer = await DatabaseInstance.atomical_offer.findFirst({
      where: {
        id: data.id,
        status: 1,
      },
    });

    if (!offer) {
      return json(errorResponse(10002));
    }

    const unsignedPsbtHex = await RedisInstance.get(
      `offer:buy:psbt:unsigned:${offer.bid}`,
    );

    if (!unsignedPsbtHex) {
      return json(errorResponse(10002));
    }

    const unsignedPsbt = Psbt.fromHex(unsignedPsbtHex, {
      network: networks.bitcoin,
    });
    const signedPsbt = Psbt.fromHex(data.signedPsbt, {
      network: networks.bitcoin,
    });

    if (
      unsignedPsbt.txInputs.length !== signedPsbt.txInputs.length ||
      unsignedPsbt.txOutputs.length !== signedPsbt.txOutputs.length
    ) {
      return json(errorResponse(10016));
    }

    for (let i = 0; i < unsignedPsbt.txInputs.length; i++) {
      if (
        !signedPsbt.txInputs[i] ||
        signedPsbt.txInputs[i].hash.toString("hex") !==
          unsignedPsbt.txInputs[i].hash.toString("hex") ||
        signedPsbt.txInputs[i].index !== unsignedPsbt.txInputs[i].index
      ) {
        return json(errorResponse(10016));
      }

      if (i > 0) {
        if (!validateInputSignature(signedPsbt, i)) {
          return json(errorResponse(10010));
        }

        signedPsbt.finalizeInput(i);
      }
    }

    const offerSignedPsbt = Psbt.fromHex(offer.signed_psbt, {
      network: networks.bitcoin,
    });

    if (
      offerSignedPsbt.txOutputs[0].address !==
        signedPsbt.txOutputs[1].address ||
      offerSignedPsbt.txOutputs[0].value !== signedPsbt.txOutputs[1].value
    ) {
      return json(errorResponse(10016));
    }

    const inputData = offerSignedPsbt.data.inputs[0];

    if (!inputData) {
      return json(errorResponse(10016));
    }

    if (!inputData.finalScriptSig || !inputData.finalScriptWitness) {
      offerSignedPsbt.finalizeInput(0);
    }

    if (offerSignedPsbt.data.inputs[0].finalScriptSig) {
      signedPsbt.updateInput(0, {
        finalScriptSig: offerSignedPsbt.data.inputs[0].finalScriptSig,
      });
    } else if (offerSignedPsbt.data.inputs[0].finalScriptWitness) {
      signedPsbt.updateInput(0, {
        finalScriptWitness: offerSignedPsbt.data.inputs[0].finalScriptWitness,
      });
    } else {
      return json(errorResponse(10011));
    }

    const rawTx = signedPsbt.extractTransaction();
    const txid = rawTx.getId();

    console.log(rawTx);
    console.log(txid);

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

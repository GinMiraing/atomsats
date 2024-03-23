import { ActionFunction, json } from "@remix-run/node";
import { isAxiosError } from "axios";
import { Psbt, networks } from "bitcoinjs-lib";
import dayjs from "dayjs";
import { z } from "zod";

import { pushTx } from "@/lib/apis/mempool";
import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { sleep } from "@/lib/utils";
import { validateInputSignature } from "@/lib/utils/bitcoin-utils";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  id: z.number().int().min(0),
  signedPsbt: z.string(),
  account: z.string(),
  receiver: z.string(),
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

    // lock 60 seconds
    const lock = await RedisInstance.get(`offer:buy:lock:${data.id}`);

    if (lock) {
      return json(errorResponse(10018));
    }

    await RedisInstance.set(`offer:buy:lock:${data.id}`, "1", "EX", 60, "NX");

    const offer = await DatabaseInstance.atomical_offer.findFirst({
      where: {
        id: data.id,
        status: 1,
      },
    });

    if (!offer) {
      RedisInstance.del(`offer:buy:lock:${data.id}`);
      return json(errorResponse(10002));
    }

    const unsignedPsbtHex = await RedisInstance.get(
      `offer:buy:psbt:unsigned:${offer.bid}`,
    );

    if (!unsignedPsbtHex) {
      RedisInstance.del(`offer:buy:lock:${data.id}`);
      return json(errorResponse(10002));
    }

    // check unsigned psbt and signed psbt
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
      RedisInstance.del(`offer:buy:lock:${data.id}`);
      return json(errorResponse(10016));
    }

    for (let i = 0; i < unsignedPsbt.txInputs.length; i++) {
      if (
        !signedPsbt.txInputs[i] ||
        signedPsbt.txInputs[i].hash.toString("hex") !==
          unsignedPsbt.txInputs[i].hash.toString("hex") ||
        signedPsbt.txInputs[i].index !== unsignedPsbt.txInputs[i].index
      ) {
        RedisInstance.del(`offer:buy:lock:${data.id}`);
        return json(errorResponse(10016));
      }

      // only last input is atomical input
      if (i !== unsignedPsbt.txInputs.length - 1) {
        if (!validateInputSignature(signedPsbt, i)) {
          RedisInstance.del(`offer:buy:lock:${data.id}`);
          return json(errorResponse(10010));
        }

        signedPsbt.finalizeInput(i);
      }
    }

    // get offer signed psbt
    const offerSignedPsbt = Psbt.fromHex(offer.signed_psbt, {
      network: networks.bitcoin,
    });

    // check funding receiver
    if (
      offerSignedPsbt.txOutputs[0].address !==
        signedPsbt.txOutputs[1].address ||
      offerSignedPsbt.txOutputs[0].value !== signedPsbt.txOutputs[1].value
    ) {
      RedisInstance.del(`offer:buy:lock:${data.id}`);
      return json(errorResponse(10016));
    }

    const inputData = offerSignedPsbt.data.inputs[0];

    if (!inputData) {
      RedisInstance.del(`offer:buy:lock:${data.id}`);
      return json(errorResponse(10016));
    }

    if (!inputData.finalScriptSig && !inputData.finalScriptWitness) {
      offerSignedPsbt.finalizeInput(0);
    }

    const signedPsbtLastInputIndex = signedPsbt.txInputs.length - 1;

    // update signed psbt
    if (offerSignedPsbt.data.inputs[0].finalScriptSig) {
      signedPsbt.updateInput(signedPsbtLastInputIndex, {
        finalScriptSig: offerSignedPsbt.data.inputs[0].finalScriptSig,
      });
    } else if (offerSignedPsbt.data.inputs[0].finalScriptWitness) {
      signedPsbt.updateInput(signedPsbtLastInputIndex, {
        finalScriptWitness: offerSignedPsbt.data.inputs[0].finalScriptWitness,
      });
    } else {
      RedisInstance.del(`offer:buy:lock:${data.id}`);
      return json(errorResponse(10011));
    }

    const rawTx = signedPsbt.extractTransaction();

    await DatabaseInstance.atomical_order.create({
      data: {
        bid: offer.bid,
        atomical_id: offer.atomical_id,
        atomical_number: offer.atomical_number,
        type: offer.type,
        price: offer.price,
        status: 2,
        list_account: offer.list_account,
        item_receiver: data.receiver,
        signed_psbt: signedPsbt.toHex(),
        tx: rawTx.getId(),
        create_at: dayjs().unix(),
        update_at: dayjs().unix(),
        realm: offer.realm,
        dmitem: offer.dmitem,
        container: offer.container,
      },
    });

    try {
      await sleep(500);
      await pushTx(networks.bitcoin, rawTx.toHex());
    } catch (e) {
      console.log(e);
      RedisInstance.del(`offer:buy:lock:${data.id}`);
      if (isAxiosError(e) && !e.response) {
        RedisInstance.set(
          `rawtx:${data.account}:${offer.bid}`,
          rawTx.toHex(),
          "NX",
        );
      }
      return json({
        data: null,
        error: true,
        code: 20004,
      });
    }

    const time = dayjs().startOf("hour").format("YYYY:MM:DD:HH");

    Promise.all([
      DatabaseInstance.$transaction([
        DatabaseInstance.atomical_offer.update({
          data: {
            status: 3,
            update_at: dayjs().unix(),
          },
          where: {
            bid: offer.bid,
          },
        }),
        DatabaseInstance.atomical_order.update({
          data: {
            status: 1,
            update_at: dayjs().unix(),
          },
          where: {
            bid: offer.bid,
          },
        }),
        offer.type === 2
          ? DatabaseInstance.atomical_dmitem.updateMany({
              data: {
                bid: null,
              },
              where: {
                atomical_id: offer.atomical_id,
              },
            })
          : DatabaseInstance.atomical_realm.updateMany({
              data: {
                bid: null,
              },
              where: {
                atomical_id: offer.atomical_id,
              },
            }),
      ]),
      RedisInstance.multi([
        [
          "incrby",
          offer.type === 1
            ? `state:market:volumes:realm:${time}`
            : `state:market:volumes:container:${offer.container || "unknown"}:${time}`,
          offer.price,
        ],
        [
          "incr",
          offer.type === 1
            ? `state:market:sales:realm:${time}`
            : `state:market:sales:container:${offer.container || "unknown"}:${time}`,
        ],
        [
          "incrby",
          offer.type === 1
            ? `state:market:volumes:realm:total`
            : `state:market:volumes:container:${offer.container || "unknown"}:total`,
          offer.price,
        ],
        ["del", `offer:buy:psbt:unsigned:${offer.bid}`],
        ["del", `offer:buy:lock:${data.id}`],
      ]).exec(),
    ]);

    return json({
      data: {
        tx: rawTx.getId(),
        refundVout:
          signedPsbt.txOutputs[signedPsbt.txOutputs.length - 1].address ===
          data.account
            ? signedPsbt.txOutputs.length - 1
            : null,
      },
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

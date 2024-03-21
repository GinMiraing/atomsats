import { ActionFunction, json } from "@remix-run/node";
import { Psbt, networks } from "bitcoinjs-lib";

import { getElectrumClient } from "@/lib/apis/atomical";
import { isDMINT, isREALM } from "@/lib/apis/atomical/type";
import DatabaseInstance from "@/lib/server/prisma.server";
import {
  detectScriptToAddressType,
  reverseBuffer,
} from "@/lib/utils/address-helpers";
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

export const action: ActionFunction = async ({ params }) => {
  const { id } = params as { id: string };
  const electrum = getElectrumClient(networks.bitcoin);

  try {
    // check id is int
    if (!Number.isInteger(parseInt(id))) {
      return json(errorResponse(10001));
    }

    // get offer
    const offer = await DatabaseInstance.atomical_offer.findFirst({
      where: {
        id: parseInt(id),
        status: 1,
      },
    });

    if (!offer) {
      return json(errorResponse(10002));
    }

    // get atomical
    const { result } = await electrum.atomicalsGetState(
      offer.atomical_id,
      true,
    );

    if (!result) {
      deleteOffer(parseInt(id));
      return json(errorResponse(10006));
    }

    // check atomical type
    if (
      (!isREALM(result) && !isDMINT(result)) ||
      result.subtype.includes("request")
    ) {
      deleteOffer(parseInt(id));
      return json(errorResponse(10007));
    }

    // check atomical location
    if (!result.location_info || result.location_info.length === 0) {
      deleteOffer(parseInt(id));
      return json(errorResponse(10008));
    }

    const atomicalLocation = result.location_info[0];

    if (
      atomicalLocation.txid !== offer.tx ||
      atomicalLocation.index !== offer.vout ||
      atomicalLocation.value !== offer.value
    ) {
      deleteOffer(parseInt(id));
      return json(errorResponse(10008));
    }

    // check atomical owner
    try {
      const owner = detectScriptToAddressType(atomicalLocation.script);

      if (owner !== offer.list_account) {
        throw new Error("atomical not owned by the address");
      }
    } catch (e) {
      deleteOffer(parseInt(id));
      return json(errorResponse(10009));
    }

    // check psbt
    const psbt = Psbt.fromHex(offer.signed_psbt);

    const inputTx = psbt.txInputs[0];
    const inputTxId = reverseBuffer(inputTx.hash).toString("hex");

    if (
      inputTxId !== atomicalLocation.txid ||
      inputTx.index !== atomicalLocation.index
    ) {
      deleteOffer(parseInt(id));
      return json(errorResponse(10010));
    }

    // check psbt final script
    const inputData = psbt.data.inputs[0];

    if (!inputData.witnessUtxo) {
      deleteOffer(parseInt(id));
      return json(errorResponse(10011));
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

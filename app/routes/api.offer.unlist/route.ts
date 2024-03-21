import { ActionFunction, json } from "@remix-run/node";
import { verifyMessage } from "@unisat/wallet-utils";
import { Verifier } from "bip322-js";
import { networks } from "bitcoinjs-lib";
import dayjs from "dayjs";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import { AccountInfo } from "@/lib/types";
import { detectAccountTypeFromScript } from "@/lib/utils/address-helpers";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  bid: z.string(),
  atomicalId: z.string(),
  type: z.enum(["dmitem", "realm"]),
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

    const message = `unlist ${data.bid} from ${data.account}`;

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

    await DatabaseInstance.$transaction([
      DatabaseInstance.atomical_offer.update({
        data: {
          status: 2,
          update_at: dayjs().unix(),
        },
        where: {
          bid: data.bid,
        },
      }),
      data.type === "dmitem"
        ? DatabaseInstance.atomical_dmitem.updateMany({
            data: {
              bid: null,
            },
            where: {
              atomical_id: data.atomicalId,
            },
          })
        : DatabaseInstance.atomical_realm.updateMany({
            data: {
              bid: null,
            },
            where: {
              atomical_id: data.atomicalId,
            },
          }),
    ]);

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

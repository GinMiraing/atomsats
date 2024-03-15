import { LoaderFunction, json } from "@remix-run/node";
import { networks } from "bitcoinjs-lib";

import { getElectrumClient } from "@/lib/apis/atomical";
import { isDMINT } from "@/lib/apis/atomical/type";

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params as { id: string };

  try {
    const { result } = await getElectrumClient(
      networks.bitcoin,
    ).atomicalsGetState(id, true);

    if (!isDMINT(result)) {
      return json({
        data: null,
        error: true,
        code: 10003,
      });
    }

    const contentType = result["mint_data"]["fields"]["args"]["main"] as string;

    if (!contentType) {
      return json({
        data: null,
        error: true,
        code: 10004,
      });
    }

    const hexData = result["mint_data"]["fields"][contentType]["$b"] as string;

    return new Response(Buffer.from(hexData, "hex"), {
      headers: {
        "Content-Type":
          contentType === "image.svg"
            ? "image/svg+xml"
            : contentType.replace(".", "/"),
      },
    });
  } catch (e) {
    return json({
      data: null,
      error: true,
      code: 20003,
    });
  }
};

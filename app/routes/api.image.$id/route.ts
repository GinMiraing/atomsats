import { LoaderFunction, json } from "@remix-run/node";
import { networks } from "bitcoinjs-lib";

import { getElectrumClient } from "@/lib/apis/atomical";
import { getAtomicalContent } from "@/lib/utils";

export const loader: LoaderFunction = async ({ params }) => {
  const { id } = params as { id: string };

  try {
    const { result } = await getElectrumClient(
      networks.bitcoin,
    ).atomicalsGetState(id, true);

    const resp = getAtomicalContent(result);

    if (!resp.contentType) {
      return json({
        data: null,
        error: true,
        code: 10003,
      });
    } else {
      return new Response(Buffer.from(resp.content, "hex"), {
        headers: {
          "Content-Type":
            resp.contentType === "svg"
              ? "image/svg+xml"
              : ["mp4", "webm", "ogg"].includes(resp.contentType)
                ? `video/${resp.contentType}`
                : resp.contentType,
        },
      });
    }
  } catch (e) {
    console.log(e);
    return json({
      data: null,
      error: true,
      code: 20003,
    });
  }
};

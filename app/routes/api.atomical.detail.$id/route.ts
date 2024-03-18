import { LoaderFunction, json } from "@remix-run/node";
import { isAxiosError } from "axios";
import { networks } from "bitcoinjs-lib";

import { getElectrumClient } from "@/lib/apis/atomical";

export const loader: LoaderFunction = async ({ params }) => {
  const id = params.id as string;

  const electrumClient = getElectrumClient(networks.bitcoin);

  try {
    const { result } = await electrumClient.atomicalsGetState(id, true);

    return json(result);
  } catch (e) {
    console.error(e);
    if (isAxiosError(e)) {
      return json(
        {
          error: e.response?.data.message,
        },
        {
          status: e.response?.status,
        },
      );
    }

    return json(
      {
        error: "internal server error",
      },
      {
        status: 500,
      },
    );
  }
};

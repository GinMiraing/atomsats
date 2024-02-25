import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { networks } from "bitcoinjs-lib";
import useSWR from "swr";

import { getElectrumClient } from "@/lib/apis/atomical";
import { getAddressBalance } from "@/lib/apis/mempool";
import useBTCPrice from "@/lib/hooks/useBTCPrice";
import { useToast } from "@/lib/hooks/useToast";
import { formatAddress } from "@/lib/utils";
import { detectAddressType } from "@/lib/utils/address-helpers";

import CopyButton from "@/components/CopyButton";

export const loader: LoaderFunction = async ({ params }) => {
  const address = params.address as string;

  if (!detectAddressType(address)) {
    throw new Error("invalid address");
  }

  return json({ address });
};

export default function Address() {
  const { address } = useLoaderData<{
    address: string;
  }>();

  const electrumClient = getElectrumClient(networks.bitcoin);
  const { toast } = useToast();
  const { BTCPrice, BTCPriceValidating } = useBTCPrice();

  const { data, isLoading, isValidating } = useSWR(
    `portfolio-${address}`,
    async () => {
      const balance = await getAddressBalance(address, networks.bitcoin);
      const { atomicals } = await electrumClient.atomicalsByAddress(address);

      const atomicalList = Object.values(atomicals);

      const arc20TokenSummary = atomicalList.reduce<number>((acc, cur) => {
        if (cur.type === "FT") {
          acc += cur.confirmed;
        }
        return acc;
      }, 0);

      const realmCount = atomicalList.reduce<number>((acc, cur) => {
        if (cur.subtype === "realm" || cur.subtype === "subrealm") {
          acc += 1;
        }
        return acc;
      }, 0);

      const dmitemCount = atomicalList.reduce<number>((acc, cur) => {
        if (cur.subtype === "dmitem") {
          acc += 1;
        }
        return acc;
      }, 0);

      const containerCount = atomicalList.reduce<number>((acc, cur) => {
        if (cur.subtype === "container") {
          acc += 1;
        }
        return acc;
      }, 0);

      return {
        balance: {
          total: balance.totalBalance,
          confirmed: balance.confirmedBalance,
        },
        atomicals,
        atomicalsSummary: {
          arc20TokenSummary,
          realmCount,
          dmitemCount,
          containerCount,
        },
      };
    },
    {
      refreshInterval: 1000 * 60 * 30,
    },
  );

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="flex items-center space-x-2">
        <div className="text-2xl text-primary">{formatAddress(address, 6)}</div>
        <CopyButton text={address} />
        <a
          href={`https://mempool.space/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-5 w-5 overflow-hidden rounded-md"
        >
          <img
            src="/icons/mempool.svg"
            alt="Mempool"
            className="h-full w-full"
          />
        </a>
      </div>
      <div className="mt-4 flex">
        <div className="rounded-md bg-secondary px-2 py-1 text-primary">
          BTC Balance
        </div>
      </div>
    </div>
  );
}

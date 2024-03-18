import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, useNavigation, useRevalidator } from "@remix-run/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

import { useBTCPrice } from "@/lib/hooks/useBTCPrice";
import DatabaseInstance from "@/lib/server/prisma.server";
import { OfferSummary } from "@/lib/types/market";
import { formatNumber, satsToBTC } from "@/lib/utils";

import { renderIndexerPreview } from "@/components/AtomicalPreview";
import { Button } from "@/components/Button";

import Banner from "./components/Banner";

export const loader: LoaderFunction = async () => {
  try {
    const offers = await DatabaseInstance.atomical_offer.findMany({
      select: {
        id: true,
        atomical_id: true,
        atomical_number: true,
        type: true,
        price: true,
        create_at: true,
        realm: true,
        dmitem: true,
        container: true,
      },
      where: {
        status: 1,
      },
      orderBy: [{ create_at: "desc" }],
      take: 50,
    });

    return json({
      offers: offers.map((offer) => ({
        id: offer.id,
        atomicalId: offer.atomical_id,
        atomicalNumber: offer.atomical_number,
        type: offer.type === 1 ? "realm" : "dmitem",
        price: parseInt(offer.price.toString()),
        createAt: offer.create_at,
        realm: offer.realm,
        dmitem: offer.dmitem,
        container: offer.container,
      })),
    });
  } catch (e) {
    console.log(e);

    return json({
      offers: [],
      error: "internal server error",
    });
  }
};

export default function Index() {
  const { offers, error } = useLoaderData<{
    offers: OfferSummary[];
    error?: string;
  }>();

  const { BTCPrice } = useBTCPrice();
  const revalidator = useRevalidator();
  const { state } = useNavigation();

  useEffect(() => {
    const timer = setInterval(() => {
      if (revalidator.state === "idle") {
        revalidator.revalidate();
      }
    }, 1000 * 5);

    return () => {
      clearInterval(timer);
    };
  }, [revalidator]);

  if (error) {
    return (
      <div className="w-full space-y-4">
        <Banner />
        <div className="flex h-96 w-full flex-col items-center justify-center space-y-4">
          <div className="text-2xl">Something went wrong</div>
          <div className="text-secondary">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Banner />
      <div className="flex w-full items-center justify-between border-b py-2">
        <div className="text-xl">Recent Listing</div>
        {state === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
        )}
      </div>
      {offers.length === 0 ? (
        <div>empty</div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 xl:gap-6">
          {offers.map((offer) => (
            <div
              className="w-full overflow-hidden rounded-md border shadow-md"
              key={offer.id}
            >
              <div className="relative flex aspect-square w-full items-center justify-center bg-primary">
                {renderIndexerPreview({
                  subtype: offer.type,
                  atomicalId: offer.atomicalId,
                  payload: {
                    realm: offer.realm,
                  },
                })}
                <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
                  {offer.type.toUpperCase()}
                </div>
                <div className="absolute bottom-0 left-0 right-0 flex h-8 items-center justify-center bg-black/40 px-1.5 text-sm text-white">
                  #{offer.atomicalNumber}
                </div>
              </div>
              <div className="flex w-full flex-col space-y-4 border-t bg-secondary p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img
                      src="/icons/btc.svg"
                      alt="btc"
                      className="h-5 w-5"
                    />
                    <div>
                      {satsToBTC(offer.price, {
                        digits: 8,
                        keepTrailingZeros: false,
                      })}
                    </div>
                  </div>
                  {BTCPrice ? (
                    <div className="text-sm text-secondary">
                      {`$${formatNumber(
                        parseFloat(satsToBTC(offer.price)) * BTCPrice,
                      )}`}
                    </div>
                  ) : (
                    <div className="text-sm text-secondary">$-</div>
                  )}
                </div>
                <Button className="">Buy Now</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

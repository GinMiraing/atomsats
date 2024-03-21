import { Loader2 } from "lucide-react";
import { useState } from "react";

import { useGetAllOffers } from "@/lib/hooks/useGetOffers";
import { OfferSummary } from "@/lib/types/market";

import AtomicalBuyModal from "@/components/AtomicalBuyModal";
import {
  AtomicalOfferCard,
  AtomicalOfferCardSkeleton,
} from "@/components/AtomicalOfferCard";
import { Button } from "@/components/Button";
import { useWallet } from "@/components/Wallet/hooks";

import Banner from "./components/Banner";

const SKELETON_ARRAY = new Array(20).fill(0).map((_, index) => index);

export default function Index() {
  const {
    data: offersWithCount,
    isValidating: offerValidating,
    mutate: refreshOffers,
  } = useGetAllOffers();
  const { account, setModalOpen } = useWallet();

  const [selectedOffer, setSelectedOffer] = useState<OfferSummary>();

  if (!offersWithCount) {
    return (
      <div className="w-full space-y-4">
        <Banner />
        <div className="flex w-full items-center justify-between border-b py-2">
          <div className="text-xl">Recent Listing</div>
          {offerValidating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
          )}
        </div>
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 xl:gap-6">
          {SKELETON_ARRAY.map((index) => (
            <AtomicalOfferCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Banner />
      <div className="flex w-full items-center justify-between border-b py-2">
        <div className="text-xl">Recent Listing</div>
        {offerValidating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
        )}
      </div>
      {offersWithCount.offers.length === 0 ? (
        <div>empty</div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5 xl:gap-6">
          {offersWithCount.offers.map((offer) => (
            <AtomicalOfferCard
              offer={offer}
              key={offer.id}
            >
              <Button
                disabled={account && account.address === offer.lister}
                onClick={() => {
                  if (!account) {
                    setModalOpen(true);
                    return;
                  }

                  setSelectedOffer(offer);
                }}
              >
                Buy Now
              </Button>
            </AtomicalOfferCard>
          ))}
        </div>
      )}
      <AtomicalBuyModal
        offer={selectedOffer}
        onClose={() => {
          if (!offerValidating) {
            refreshOffers();
          }
          setSelectedOffer(undefined);
        }}
      />
    </div>
  );
}

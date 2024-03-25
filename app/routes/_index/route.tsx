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
import EmptyTip from "@/components/EmptyTip";
import GridList from "@/components/GridList";
import { useWallet } from "@/components/Wallet/hooks";

import Banner from "./components/Banner";

const SKELETON_ARRAY = new Array(20).fill(0).map((_, index) => index);

export default function Index() {
  const { offers, offersValidating, offersLoading, refreshOffers } =
    useGetAllOffers();
  const { account, setModalOpen } = useWallet();

  const [selectedOffer, setSelectedOffer] = useState<OfferSummary>();

  if (!offers || offersLoading) {
    return (
      <div className="w-full space-y-4">
        <Banner />
        <div className="flex w-full items-center justify-between border-b py-2">
          <div className="text-xl">Recent Listing</div>
          {offersValidating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
          )}
        </div>
        <GridList>
          {SKELETON_ARRAY.map((index) => (
            <AtomicalOfferCardSkeleton key={index} />
          ))}
        </GridList>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Banner />
      <div className="flex w-full items-center justify-between border-b py-2">
        <div className="text-xl">Recent Listing</div>
        {offersValidating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
        )}
      </div>
      {offers.offers.length === 0 ? (
        <EmptyTip />
      ) : (
        <GridList>
          {offers.offers.map((offer) => (
            <AtomicalOfferCard
              offer={offer}
              key={offer.id}
            >
              <Button
                className="w-full"
                disabled={account && account.address === offer.lister}
                onClick={() => {
                  if (!account) {
                    setModalOpen(true);
                    return;
                  }

                  setSelectedOffer(offer);
                }}
              >
                {account && account.address === offer.lister
                  ? "Your Listing"
                  : "Buy Now"}
              </Button>
            </AtomicalOfferCard>
          ))}
        </GridList>
      )}
      <AtomicalBuyModal
        offer={selectedOffer}
        onClose={() => {
          if (!offersValidating) {
            refreshOffers();
          }
          setSelectedOffer(undefined);
        }}
      />
    </div>
  );
}

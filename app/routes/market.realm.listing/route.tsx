import { useSearchParams } from "@remix-run/react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { useState } from "react";

import { useGetRealmOffers } from "@/lib/hooks/useGetOffers";
import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { OfferSummary } from "@/lib/types/market";

import AtomicalBuyModal from "@/components/AtomicalBuyModal";
import {
  AtomicalOfferCard,
  AtomicalOfferCardSkeleton,
} from "@/components/AtomicalOfferCard";
import { Button } from "@/components/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useWallet } from "@/components/Wallet/hooks";

import { useRealmFilters } from "../market.realm/hooks/useRealmFilters";

const SKELETON_ARRAY = new Array(20).fill(0).map((_, index) => index);

export default function MarketRealmListing() {
  const {
    data: offersWithCount,
    isLoading: offersLoading,
    isValidating: offerValidating,
    mutate: refreshOffers,
  } = useGetRealmOffers();
  const { account, setModalOpen } = useWallet();

  const [selectedOffer, setSelectedOffer] = useState<OfferSummary>();

  if (!offersWithCount || offersLoading) {
    return (
      <div className="w-full space-y-4">
        <Filter isValidating={offerValidating} />
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
      <Filter isValidating={offerValidating} />
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

const Filter: React.FC<{
  isValidating: boolean;
}> = ({ isValidating }) => {
  const { searchParams, updateSearchParams } = useSetSearch();
  const { setFilterOpen } = useRealmFilters();

  const sort = searchParams.get("sort") || "price:asc";

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex h-5 w-5 items-center justify-center">
        {isValidating ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-green-400"></div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={() => setFilterOpen(true)}>
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Select
          value={sort}
          onValueChange={(value) =>
            updateSearchParams(
              { sort: value },
              { action: "push", scroll: false },
            )
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id:desc">Newest</SelectItem>
            <SelectItem value="price:asc">Price: Low to High</SelectItem>
            <SelectItem value="price:desc">Price: High to Low</SelectItem>
            <SelectItem value="number:asc">Number: Low to High</SelectItem>
            <SelectItem value="number:desc">Number: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

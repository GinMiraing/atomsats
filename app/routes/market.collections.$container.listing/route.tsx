import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";

import { useGetDmitemOffers } from "@/lib/hooks/useGetOffers";
import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { OfferSummary } from "@/lib/types/market";

import AtomicalBuyModal from "@/components/AtomicalBuyModal";
import {
  AtomicalOfferCard,
  AtomicalOfferCardSkeleton,
} from "@/components/AtomicalOfferCard";
import { Button } from "@/components/Button";
import EmptyTip from "@/components/EmptyTip";
import GridList from "@/components/GridList";
import Pagination from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useWallet } from "@/components/Wallet/hooks";

export const loader: LoaderFunction = async ({ params }) => {
  const { container } = params as { container: string };

  return json({
    container,
  });
};

const SKELETON_ARRAY = new Array(20).fill(0).map((_, index) => index);

export default function MarketContainerListing() {
  const { container } = useLoaderData<{
    container: string;
  }>();

  const {
    dmitemOffers,
    dmitemOffersLoading,
    dmitemOffersValidating,
    refreshDmitemOffers,
  } = useGetDmitemOffers(container);
  const { account, setModalOpen } = useWallet();
  const { searchParams, updateSearchParams } = useSetSearch();

  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1") || 1,
    [searchParams],
  );
  const total = useMemo(
    () => (dmitemOffers ? Math.ceil(dmitemOffers.count / 30) : 1),
    [dmitemOffers],
  );

  const [selectedOffer, setSelectedOffer] = useState<OfferSummary>();

  if (!dmitemOffers || dmitemOffersLoading) {
    return (
      <div className="w-full space-y-6">
        <Filter isValidating={dmitemOffersValidating} />
        <GridList>
          {SKELETON_ARRAY.map((index) => (
            <AtomicalOfferCardSkeleton key={index} />
          ))}
        </GridList>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Filter isValidating={dmitemOffersValidating} />
      {dmitemOffers.offers.length === 0 ? (
        <EmptyTip />
      ) : (
        <GridList>
          {dmitemOffers.offers.map((offer) => (
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
                {account && account.address === offer.lister
                  ? "Your Listing"
                  : "Buy Now"}
              </Button>
            </AtomicalOfferCard>
          ))}
        </GridList>
      )}
      <Pagination
        page={page}
        total={total}
        onPageChange={(value) =>
          updateSearchParams({ page: value }, { action: "push", scroll: false })
        }
      />
      <AtomicalBuyModal
        offer={selectedOffer}
        onClose={() => {
          if (!dmitemOffersValidating) {
            refreshDmitemOffers();
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

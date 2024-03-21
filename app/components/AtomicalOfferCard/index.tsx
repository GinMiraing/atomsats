import { useBTCPrice } from "@/lib/hooks/useBTCPrice";
import { OfferSummary } from "@/lib/types/market";
import { formatNumber, satsToBTC } from "@/lib/utils";

import { renderIndexerPreview } from "../AtomicalPreview";
import { Button } from "../Button";

const AtomicalOfferCard: React.FC<{
  offer: OfferSummary;
  children: React.ReactNode;
}> = ({ offer, children }) => {
  const { BTCPrice } = useBTCPrice();

  return (
    <div className="w-full overflow-hidden rounded-md border shadow-md">
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
        {children}
      </div>
    </div>
  );
};

const AtomicalOfferCardSkeleton: React.FC = () => {
  return (
    <div className="w-full overflow-hidden rounded-md border shadow-md">
      <div className="relative flex aspect-square w-full items-center justify-center bg-skeleton"></div>
      <div className="flex w-full flex-col space-y-4 border-t bg-secondary p-3">
        <div className="flex items-center justify-between">
          <div className="flex h-6 w-20 items-center space-x-2 rounded bg-skeleton"></div>
          <div className="text-sm text-secondary">$-</div>
        </div>
        <Button disabled={true}>Buy Now</Button>
      </div>
    </div>
  );
};

export { AtomicalOfferCard, AtomicalOfferCardSkeleton };

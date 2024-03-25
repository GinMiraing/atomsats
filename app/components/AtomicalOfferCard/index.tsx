import { Heart, ScrollText } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useBTCPrice } from "@/lib/hooks/useBTCPrice";
import { useLikeOffer } from "@/lib/hooks/useLikeOffer";
import { useToast } from "@/lib/hooks/useToast";
import { OfferSummary } from "@/lib/types/market";
import { cn, formatNumber, satsToBTC } from "@/lib/utils";
import { formatError } from "@/lib/utils/error-helpers";

import { renderIndexerPreview } from "../AtomicalPreview";
import { Button } from "../Button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../HoverCard";
import { useWallet } from "../Wallet/hooks";

const AtomicalOfferCard: React.FC<{
  offer: OfferSummary;
  children: React.ReactNode;
}> = ({ offer, children }) => {
  const { BTCPrice } = useBTCPrice();
  const { likeOffer, unlikeOffer } = useLikeOffer();
  const { account, setModalOpen } = useWallet();
  const [liked, setLiked] = useState(false);
  const [likedAddressCount, setLikedAddressCount] = useState(
    offer.favorAddress.length,
  );
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const isRed = useMemo(() => {
    if (!account && offer.favorAddress.length > 0) return true;

    if (!liked) return false;

    if (account && account.address === offer.lister) return false;

    return true;
  }, [liked, offer, account]);

  const setOfferLike = async (like: boolean) => {
    if (!account) {
      setModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      if (like) {
        await likeOffer(offer.id);
        setLiked(true);
        setLikedAddressCount(likedAddressCount + 1);
      } else {
        await unlikeOffer(offer.id);
        setLiked(false);
        setLikedAddressCount(likedAddressCount - 1);
      }
    } catch (e) {
      console.log(e);
      toast({
        variant: "destructive",
        duration: 2000,
        title: "Like offer failed",
        description: formatError(e),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!account) return setLiked(false);

    setLikedAddressCount(offer.favorAddress.length);

    if (offer.favorAddress.includes(account.address)) {
      setLiked(true);
      return;
    }
  }, [offer.id, account]);

  return (
    <div className="w-full overflow-hidden rounded-md border shadow-md">
      <div className="relative flex aspect-square w-full items-center justify-center bg-primary">
        {renderIndexerPreview({
          subtype: offer.type,
          atomicalId: offer.atomicalId,
          payload: {
            realm: offer.realm,
            parentContainer: offer.container,
          },
        })}
        <div className="absolute left-2 top-2 rounded bg-theme px-1.5 text-sm text-white">
          {offer.type.toUpperCase()}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex h-8 items-center justify-center bg-black/40 px-1.5 text-sm text-white">
          #{offer.atomicalNumber}
        </div>
        <div className="absolute right-2 top-2 flex items-center justify-center space-x-1 bg-transparent">
          <div
            className={cn("text-sm", {
              hidden: likedAddressCount === 0,
              "text-[#f87171]": isRed,
              "text-[#a1a1aa]": !isRed,
            })}
          >
            {likedAddressCount}
          </div>
          <Heart
            onClick={() => setOfferLike(!liked)}
            fill={isRed ? "#f87171" : "#a1a1aa"}
            className={cn("h-6 w-6", {
              "pointer-events-none":
                loading || offer.lister === account?.address,
              "cursor-pointer": !loading && offer.lister !== account?.address,
              "text-[#f87171]": isRed,
              "text-[#a1a1aa]": !isRed,
            })}
          />
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
        <div className="flex w-full space-x-2">
          <div className="w-full grow">{children}</div>
          <div className="grow-0">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button disabled={!offer.description}>
                  <ScrollText className="h-5 w-5" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="hyphens-manual break-all leading-7">
                {offer.description}
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
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

import { LoaderFunction, json } from "@remix-run/node";
import {
  Outlet,
  useLoaderData,
  useLocation,
  useNavigate,
} from "@remix-run/react";
import { useMemo } from "react";

import { useContainerMarketStates } from "@/lib/hooks/useGetMarketStates";
import { formatNumber, satsToBTC } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";

export const loader: LoaderFunction = async ({ params }) => {
  const { container } = params as { container: string };

  return json({
    container,
  });
};

export default function MarketCollections() {
  const { container } = useLoaderData<{
    container: string;
  }>();

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { containerData, containerLoading } =
    useContainerMarketStates(container);

  const splitValue = useMemo(() => pathname.split("/")[4], [pathname]);

  return (
    <div className="w-full space-y-6">
      {!containerData || containerLoading ? (
        <Skeleton />
      ) : (
        <>
          <div className="flex space-x-4">
            <Avatar className="h-24 w-24 rounded-md">
              <AvatarImage
                className="h-full w-full"
                src={containerData.iconUrl}
                alt={containerData.name}
              />
              <AvatarFallback className="rounded-md bg-secondary">
                {containerData.name.split("")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-2xl font-bold">
              {containerData.name.toUpperCase()}
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-6 lg:gap-6">
            <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
              <div className="text-lg text-secondary">Floor Price</div>
              <div className="flex items-center space-x-2">
                <img
                  src="/icons/btc.svg"
                  alt="btc"
                  className="h-5 w-5"
                />
                <div>
                  {formatNumber(
                    parseFloat(
                      satsToBTC(containerData.floorPrice, { digits: 8 }),
                    ),
                    {
                      precision: 6,
                    },
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
              <div className="text-lg text-secondary">Listings</div>
              <div>{formatNumber(containerData.listings)}</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
              <div className="text-lg text-secondary">Sales(24H)</div>
              <div>{formatNumber(containerData.sales1Day)}</div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
              <div className="text-lg text-secondary">Volume(24H)</div>
              <div className="flex items-center space-x-2">
                <img
                  src="/icons/btc.svg"
                  alt="btc"
                  className="h-5 w-5"
                />
                <div>
                  {formatNumber(
                    parseFloat(
                      satsToBTC(containerData.volume1Day, { digits: 8 }),
                    ),
                    {
                      precision: 6,
                    },
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
              <div className="text-lg text-secondary">Volume(7D)</div>
              <div className="flex items-center space-x-2">
                <img
                  src="/icons/btc.svg"
                  alt="btc"
                  className="h-5 w-5"
                />
                <div>
                  {formatNumber(
                    parseFloat(
                      satsToBTC(containerData.volume7Day, { digits: 8 }),
                    ),
                    {
                      precision: 6,
                    },
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
              <div className="text-lg text-secondary">Volume Total</div>
              <div className="flex items-center space-x-2">
                <img
                  src="/icons/btc.svg"
                  alt="btc"
                  className="h-5 w-5"
                />
                <div>
                  {formatNumber(
                    parseFloat(
                      satsToBTC(containerData.volumeTotal, { digits: 8 }),
                    ),
                    {
                      precision: 6,
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <Tabs
        value={splitValue}
        className="border-b"
        onValueChange={(value) => {
          navigate(`/market/collections/${container}/${value}`, {
            preventScrollReset: true,
          });
        }}
      >
        <TabsList>
          <TabsTrigger
            className="text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="listing"
          >
            Listing
          </TabsTrigger>
          <TabsTrigger
            className="text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="history"
          >
            history
          </TabsTrigger>
          <TabsTrigger
            className="text-primary transition-colors hover:text-theme-hover data-[state=active]:bg-transparent data-[state=active]:text-theme"
            value="items"
          >
            items
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  );
}

const Skeleton = () => {
  return (
    <>
      <div className="flex space-x-4">
        <div className="h-24 w-24 animate-pulse rounded-md bg-skeleton"></div>
        <div className="flex h-8 w-40 items-center">
          <div className="h-6 w-full animate-pulse rounded-md bg-skeleton"></div>
        </div>
      </div>
      <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-6 lg:gap-6">
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Floor Price</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div className="h-6 w-20 animate-pulse rounded-md bg-skeleton"></div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Listings</div>
          <div className="h-6 w-20 animate-pulse rounded-md bg-skeleton"></div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Sales(24H)</div>
          <div className="h-6 w-20 animate-pulse rounded-md bg-skeleton"></div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Volume(24H)</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div className="h-6 w-20 animate-pulse rounded-md bg-skeleton"></div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Volume(7D)</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div className="h-6 w-20 animate-pulse rounded-md bg-skeleton"></div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 overflow-hidden rounded-md bg-secondary p-4">
          <div className="text-lg text-secondary">Volume Total</div>
          <div className="flex items-center space-x-2">
            <img
              src="/icons/btc.svg"
              alt="btc"
              className="h-5 w-5"
            />
            <div className="h-6 w-20 animate-pulse rounded-md bg-skeleton"></div>
          </div>
        </div>
      </div>
    </>
  );
};

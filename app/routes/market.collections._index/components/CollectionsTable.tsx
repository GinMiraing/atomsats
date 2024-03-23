import { useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { useCollectionsMarketStates } from "@/lib/hooks/useGetMarketStates";
import { useSetSearch } from "@/lib/hooks/useSetSearch";
import { CollectionMarketStates } from "@/lib/types/market";
import { formatNumber, satsToBTC } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar";
import Pagination from "@/components/Pagination";
import SortIcon from "@/components/SortIcon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Table";

const ITEMS_PER_PAGE = 15;

const CollectionsTable: React.FC = () => {
  const { collections, collectionsLoading, collectionsValidating } =
    useCollectionsMarketStates();
  const navigate = useNavigate();
  const { searchParams, updateSearchParams } = useSetSearch();

  const [sorting, setSorting] = useState("volume1Day:desc");
  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1") || 1,
    [searchParams],
  );
  const total = useMemo(
    () =>
      collections && collections.length > 0
        ? Math.ceil(collections.length / ITEMS_PER_PAGE)
        : 1,
    [collections],
  );

  const getSortValue = useCallback(
    (container: CollectionMarketStates, sortKey: string) => {
      const mappings = {
        holders: container.holders,
        floorPrice: container.floorPrice,
        listings: container.listings,
        volume1Day: container.volume1Day,
        sales1Day: container.sales1Day,
      };

      const validSortKeys: (keyof typeof mappings)[] = [
        "holders",
        "floorPrice",
        "listings",
        "volume1Day",
        "sales1Day",
      ];
      const sortKeyValue = validSortKeys.includes(
        sortKey as keyof typeof mappings,
      )
        ? mappings[sortKey as keyof typeof mappings]
        : 0;

      return sortKeyValue;
    },
    [],
  );

  const sortedCollections = useMemo(() => {
    if (collections && collections.length > 0) {
      const [sortKey, sortDirection] = sorting.split(":");

      const sorted = collections
        .map((container) => ({
          ...container,
          sortValue: getSortValue(container, sortKey),
        }))
        .sort((a, b) => {
          if (a.rank < b.rank) {
            return 1;
          } else if (a.rank > b.rank) {
            return -1;
          } else if (sortDirection === "asc") {
            return a.sortValue - b.sortValue;
          } else {
            return b.sortValue - a.sortValue;
          }
        });

      return sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    } else {
      return [];
    }
  }, [collections, page, sorting]);

  if (!collections && collectionsLoading) {
    return <Skeleton />;
  }

  return (
    <div className="w-full space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="relative bg-secondary">
            <TableHead className="sticky left-0 bg-secondary">
              Container
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Floor Price</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="floorPrice"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Listings</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="listings"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Sales(24H)</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="sales1Day"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Volume(24H)</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="volume1Day"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Holders</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="holders"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Minted</TableHead>
            <TableHead>Deploy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCollections.map((container) => (
            <TableRow
              key={container.atomicalId}
              className="group relative cursor-pointer"
              onClick={() =>
                navigate(`/market/collections/${container.container}`)
              }
            >
              <TableCell className="sticky left-0 bg-primary transition-colors group-hover:bg-secondary">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-12 w-12 rounded-md">
                    <AvatarImage
                      className="h-full w-full"
                      src={container.iconUrl}
                      alt={container.name}
                    />
                    <AvatarFallback className="rounded-md bg-secondary">
                      {container.name.split("")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-base">
                    {container.name.toUpperCase()}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2 text-base">
                  <img
                    src="/icons/btc.svg"
                    alt="btc"
                  />
                  <div>
                    {formatNumber(
                      parseFloat(
                        satsToBTC(container.floorPrice, { digits: 8 }),
                      ),
                      {
                        precision: 6,
                      },
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {formatNumber(container.listings)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {formatNumber(container.sales1Day)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2 text-base">
                  <img
                    src="/icons/btc.svg"
                    alt="btc"
                  />
                  <div>
                    {formatNumber(
                      parseFloat(
                        satsToBTC(container.volume1Day, { digits: 8 }),
                      ),
                      {
                        precision: 6,
                      },
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {formatNumber(container.holders)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {formatNumber(container.itemCount)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {formatNumber(container.mintedCount)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {dayjs.unix(container.deployTime).format("YYYY-MM-DD HH:mm")}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        total={total}
        onPageChange={(page) =>
          updateSearchParams({ page }, { action: "push", scroll: false })
        }
      />
    </div>
  );
};

const Skeleton: React.FC = () => {
  return (
    <div className="flex h-80 w-full items-center justify-center rounded-md border">
      <Loader2 className="h-5 w-5 animate-spin text-theme" />
    </div>
  );
};

export default CollectionsTable;

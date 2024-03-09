import { Avatar } from "@radix-ui/react-avatar";
import dayjs from "dayjs";
import { AlertCircle, ChevronsUpDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import useBTCPrice from "@/lib/hooks/useBTCPrice";
import { formatNumber, satsToBTC } from "@/lib/utils";

import { AvatarFallback, AvatarImage } from "@/components/Avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/HoverCard";
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

import { useFilters } from "../hooks/useFilters";
import { useHotTokenList } from "../hooks/useHotTokenList";
import { TokenResponse } from "../types";

const ITEMS_PER_PAGE = 15;
const SKELETON_ITEMS = 6;

const TokenTable: React.FC = () => {
  const { BTCPrice } = useBTCPrice();
  const { data } = useHotTokenList();
  const { market, volumeRange } = useFilters();

  const [page, setPage] = useState(1);
  const [sorting, setSorting] = useState("volume:desc");

  const getVolume = useCallback(
    (token: TokenResponse) => {
      switch (volumeRange) {
        case "all":
          return token.market[market].volumeTotal;
        case "7d":
          return token.market[market].volume7Days;
        default:
          return token.market[market].volume1Day;
      }
    },
    [market, volumeRange],
  );

  const getSortValue = useCallback(
    (token: TokenResponse, sortKey: string) => {
      const marketData = token.market[market];

      const mappings = {
        volume: getVolume(token),
        floorPrice: marketData.floorPrice,
        marketCap: marketData.marketCap,
        holders: token.holders,
        sales: marketData.sales1Day,
        listing: marketData.totalListed,
      };

      const validSortKeys: (keyof typeof mappings)[] = [
        "volume",
        "floorPrice",
        "marketCap",
        "holders",
        "sales",
        "listing",
      ];
      const sortKeyValue = validSortKeys.includes(
        sortKey as keyof typeof mappings,
      )
        ? mappings[sortKey as keyof typeof mappings]
        : 0;

      return sortKeyValue;
    },
    [market, volumeRange],
  );

  const sortedTokens = useMemo(() => {
    if (data && data.length > 0) {
      const [sortKey, sortDirection] = sorting.split(":");

      const sorted = data
        .map((token) => ({
          ...token,
          sortValue: getSortValue(token, sortKey),
        }))
        .sort((a, b) => {
          if (sortDirection === "asc") {
            return a.sortValue - b.sortValue;
          } else {
            return b.sortValue - a.sortValue;
          }
        });

      return sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    } else {
      return [];
    }
  }, [data, page, sorting, market, volumeRange]);

  const totalPage = useMemo(() => {
    if (data) {
      return Math.ceil(data.length / ITEMS_PER_PAGE);
    }

    return 0;
  }, [data]);

  if (!data) {
    return <Skeleton />;
  }

  return (
    <div className="w-full space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary">
            <TableHead>TOKEN</TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>FLOOR</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="floorPrice"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>VOLUME</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="volume"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>SELL(24H)</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="sales"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>MARKET CAP</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="marketCap"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>HOLDERS</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="holders"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>LISTING</div>
                <SortIcon
                  clickHandler={setSorting}
                  sortKey="listing"
                  sorting={sorting}
                />
              </div>
            </TableHead>
            <TableHead>MINTED</TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>UPDATE AT</div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <AlertCircle className="h-4 w-4 hover:cursor-pointer" />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    We use caching to speed up request responses, therefore
                    there is a delay in data updates.
                  </HoverCardContent>
                </HoverCard>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTokens.map((token) => (
            <TableRow
              key={token.atomicalId}
              className="cursor-pointer"
            >
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={token.iconUrl}
                      alt={token.name}
                    />
                    <AvatarFallback className="bg-secondary">
                      {token.name.split("")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-base">{token.name}</div>
                </div>
              </TableCell>
              <TableCell>
                {" "}
                <div className="flex flex-col space-y-1">
                  <div className="text-base">
                    {formatNumber(token.market[market].floorPrice, {
                      precision: 4,
                    })}{" "}
                    SATS
                  </div>
                  <div>
                    $
                    {formatNumber(
                      BTCPrice *
                        parseFloat(satsToBTC(token.market[market].floorPrice)),
                      { precision: 6 },
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {" "}
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-1">
                    <img
                      className="h-4 w-4"
                      src="/icons/btc.svg"
                      alt="btc"
                    />
                    <div className="text-base">
                      {formatNumber(
                        parseFloat(
                          satsToBTC(
                            volumeRange === "all"
                              ? token.market[market].volumeTotal
                              : volumeRange === "7d"
                                ? token.market[market].volume7Days
                                : token.market[market].volume1Day,
                          ),
                        ),
                        {
                          precision: 4,
                        },
                      )}{" "}
                    </div>
                  </div>
                  <div>
                    $
                    {formatNumber(
                      BTCPrice *
                        parseFloat(
                          satsToBTC(
                            volumeRange === "all"
                              ? token.market[market].volumeTotal
                              : volumeRange === "7d"
                                ? token.market[market].volume7Days
                                : token.market[market].volume1Day,
                          ),
                        ),
                      { precision: 2 },
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {formatNumber(token.market[market].sales1Day)}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-1">
                    <img
                      className="h-4 w-4"
                      src="/icons/btc.svg"
                      alt="btc"
                    />
                    <div className="text-base">
                      {formatNumber(
                        parseFloat(satsToBTC(token.market[market].marketCap)),
                        {
                          precision: 4,
                        },
                      )}{" "}
                    </div>
                  </div>
                  <div>
                    $
                    {formatNumber(
                      BTCPrice *
                        parseFloat(satsToBTC(token.market[market].marketCap)),
                      { precision: 2 },
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">{formatNumber(token.holders)}</div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {formatNumber(token.market[market].totalListed)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {token.mintMode === "perpetual"
                    ? "∞"
                    : `${formatNumber((parseInt(token.minted) / parseInt(token.totalSupply)) * 100, { precision: 2 })}%`}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-base">
                  {dayjs.unix(token.updateAt).fromNow()}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={page}
        total={totalPage}
        onPageChange={setPage}
      />
    </div>
  );
};

const Skeleton: React.FC = () => {
  const rowArray = useMemo(
    () => new Array(SKELETON_ITEMS).fill(0).map((_, index) => index),
    [],
  );

  const cellArray = useMemo(
    () => new Array(9).fill(0).map((_, index) => index),
    [],
  );

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary">
            <TableHead>TOKEN</TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>FLOOR</div>
                <ChevronsUpDown className="h-4 w-4 cursor-pointer" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>VOLUME</div>
                <ChevronsUpDown className="h-4 w-4 cursor-pointer" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>SELL(24H)</div>
                <ChevronsUpDown className="h-4 w-4 cursor-pointer" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>MARKET CAP</div>
                <ChevronsUpDown className="h-4 w-4 cursor-pointer" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>HOLDERS</div>
                <ChevronsUpDown className="h-4 w-4 cursor-pointer" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>LISTING</div>
                <ChevronsUpDown className="h-4 w-4 cursor-pointer" />
              </div>
            </TableHead>
            <TableHead>MINTED</TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>UPDATE AT</div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <AlertCircle className="h-4 w-4 hover:cursor-pointer" />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    We use caching to speed up request responses, therefore
                    there is a delay in data updates.
                  </HoverCardContent>
                </HoverCard>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowArray.map((value) => (
            <TableRow key={`row-${value}`}>
              {cellArray.map((value) => (
                <TableCell key={`cell-${value}`}>
                  <div className="flex h-12 w-16 items-center">
                    <div className="h-6 w-full animate-pulse bg-secondary"></div>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TokenTable;

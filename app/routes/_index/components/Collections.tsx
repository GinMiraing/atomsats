import { useNavigate } from "@remix-run/react";
import dayjs from "dayjs";
import { ChevronsUpDown } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { formatNumber } from "@/lib/utils";

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

import { useCollections } from "../hooks/useCollections";
import { useFilters } from "../hooks/useFilters";
import { CollectionResponse } from "../types";

const ITEMS_PER_PAGE = 15;
const SKELETON_ITEMS = 6;

const Collections: React.FC = () => {
  const { data } = useCollections();
  const { page, setFilters } = useFilters();
  const navigate = useNavigate();

  const [sorting, setSorting] = useState("holders:desc");

  const getSortValue = useCallback(
    (container: CollectionResponse, sortKey: string) => {
      const mappings = {
        holders: container.holders,
      };

      const validSortKeys: (keyof typeof mappings)[] = ["holders"];
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
    if (data && data.length > 0) {
      const [sortKey, sortDirection] = sorting.split(":");

      const sorted = data
        .map((container) => ({
          ...container,
          sortValue: getSortValue(container, sortKey),
        }))
        .sort((a, b) => {
          if (sortDirection === "asc") {
            return a.sortValue - b.sortValue;
          } else {
            return b.sortValue - a.sortValue;
          }
        });

      return sorted.slice(
        (parseInt(page) - 1) * ITEMS_PER_PAGE,
        parseInt(page) * ITEMS_PER_PAGE,
      );
    } else {
      return [];
    }
  }, [data, page, sorting]);

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
          <TableRow className="relative bg-secondary">
            <TableHead className="sticky left-0 bg-secondary">
              Container
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      className="rounded-full"
                      src={container.iconUrl}
                      alt={container.name}
                    />
                    <AvatarFallback className="bg-secondary">
                      {container.name.split("")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-base">{container.name}</div>
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
        page={parseInt(page)}
        total={totalPage}
        onPageChange={(page) => setFilters({ page: page.toString() })}
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
    () => new Array(5).fill(0).map((_, index) => index),
    [],
  );

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary">
            <TableHead className="sticky left-0 bg-secondary">
              Container
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-2">
                <div>Holders</div>
                <ChevronsUpDown className="h-4 w-4 cursor-pointer" />
              </div>
            </TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Minted</TableHead>
            <TableHead>Deploy</TableHead>
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

export default Collections;

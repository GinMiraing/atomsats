import { Loader2 } from "lucide-react";
import { useMemo } from "react";

import { useGetMarketOrders } from "@/lib/hooks/useGetOrders";
import { useSetSearch } from "@/lib/hooks/useSetSearch";

import EmptyTip from "@/components/EmptyTip";
import Pagination from "@/components/Pagination";

import HistoryTable from "./components/HistoryTable";

export default function MarketRealmHistory() {
  const { orders, ordersLoading } = useGetMarketOrders({
    market: "realm",
  });
  const { searchParams, updateSearchParams } = useSetSearch();

  const page = useMemo(
    () => parseInt(searchParams.get("page") || "1") || 1,
    [searchParams],
  );
  const total = useMemo(
    () => (orders ? Math.ceil(orders.count / 30) : 1),
    [orders],
  );

  if (!orders || ordersLoading) {
    return (
      <div className="flex h-80 w-full items-center justify-center rounded-md border">
        <Loader2 className="h-5 w-5 animate-spin text-theme" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {orders.orders.length === 0 ? (
        <EmptyTip border />
      ) : (
        <HistoryTable orders={orders.orders} />
      )}
      <Pagination
        page={page}
        total={total}
        onPageChange={(value) =>
          updateSearchParams({ page: value }, { action: "push", scroll: false })
        }
      />
    </div>
  );
}

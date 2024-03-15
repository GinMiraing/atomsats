import { LoaderFunction, json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useCallback } from "react";

import { useSetSearch } from "@/lib/hooks/useSetSearch";
import DatabaseInstance from "@/lib/server/prisma.server";

import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs";

import { CollectionResponse } from "../_index/types";
import Items from "./components/Items";

export const loader: LoaderFunction = async ({ params }) => {
  const { container } = params as { container: string };

  const result = await DatabaseInstance.atomical_container.findFirst({
    select: {
      atomical_id: true,
      atomical_number: true,
      name: true,
      deploy_time: true,
      item_count: true,
      minted_count: true,
      holders: true,
      icon_url: true,
    },
    where: {
      container,
    },
  });

  if (!result) {
    return json({
      data: null,
      error: true,
      code: 10002,
    });
  }

  const response: CollectionResponse = {
    atomicalId: result.atomical_id,
    atomicalNumber: result.atomical_number,
    container,
    name: result.name,
    deployTime: result.deploy_time,
    itemCount: result.item_count,
    mintedCount: result.minted_count,
    holders: result.holders,
    iconUrl: result.icon_url,
    listing: 0,
    volume1Day: 0,
    volume7Days: 0,
    volumeTotal: 0,
    sales1Day: 0,
  };

  return json({
    data: response,
    error: false,
    code: 0,
  });
};

export default function MarketCollections() {
  const { data } = useLoaderData<{
    data: CollectionResponse;
  }>();

  const { updateSearchParams } = useSetSearch();

  const [searchParams, _] = useSearchParams();
  const type = searchParams.get("type") || "listing";

  const setFilters = useCallback((filters: { type: string }) => {
    updateSearchParams(filters);
  }, []);

  return (
    <div className="w-full space-y-4">
      <div className="flex"></div>
      <div>
        <Tabs
          value={type}
          onValueChange={(value) => setFilters({ type: value })}
          className="mb-6 mt-8 box-border flex items-center justify-between border-b-2"
        >
          <TabsList className="bg-transparent">
            <TabsTrigger
              className="bg-transparent text-lg transition-colors data-[state=active]:border-b-2 data-[state=active]:border-b-theme"
              value="listing"
            >
              Listing
            </TabsTrigger>
            <TabsTrigger
              className="bg-transparent text-lg transition-colors data-[state=active]:border-b-2 data-[state=active]:border-b-theme"
              value="items"
            >
              Items
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {type === "items" && <Items container={data.container} />}
    </div>
  );
}

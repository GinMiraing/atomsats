import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";

import { CollectionResponse } from "../_index/types";

export const action: ActionFunction = async ({ request }) => {
  try {
    const collections = await DatabaseInstance.atomical_container.findMany({
      select: {
        atomical_id: true,
        atomical_number: true,
        container: true,
        name: true,
        deploy_time: true,
        item_count: true,
        minted_count: true,
        holders: true,
        icon_url: true,
      },
      orderBy: [
        {
          rank: "desc",
        },
      ],
    });

    const response: CollectionResponse[] = collections.map((collection) => ({
      atomicalId: collection.atomical_id,
      atomicalNumber: collection.atomical_number,
      container: collection.container,
      name: collection.name,
      deployTime: collection.deploy_time,
      itemCount: collection.item_count,
      mintedCount: collection.minted_count,
      holders: collection.holders,
      iconUrl: collection.icon_url,
      listing: 0,
      volume1Day: 0,
      volume7Days: 0,
      volumeTotal: 0,
      sales1Day: 0,
    }));

    return json({
      data: response,
      error: false,
      code: 0,
    });
  } catch (e) {
    return json({
      data: null,
      error: true,
      code: 20001,
    });
  }
};

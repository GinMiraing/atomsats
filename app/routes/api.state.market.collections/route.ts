import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { CollectionMarketStates } from "@/lib/types/market";
import { getFormattedDatesLastNHours } from "@/lib/utils";
import { errorResponse } from "@/lib/utils/error-helpers";

export const action: ActionFunction = async () => {
  try {
    const cache = await RedisInstance.get("cache:market:state:collections");

    if (cache) {
      return json({
        data: JSON.parse(cache),
        error: false,
        code: 0,
      });
    }

    const dates = getFormattedDatesLastNHours(24 * 7);

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
        rank: true,
      },
    });

    const response: CollectionMarketStates[] = collections.map(
      (collection) => ({
        atomicalId: collection.atomical_id,
        atomicalNumber: collection.atomical_number,
        container: collection.container,
        name: collection.name,
        deployTime: collection.deploy_time,
        itemCount: collection.item_count,
        mintedCount: collection.minted_count,
        holders: collection.holders,
        iconUrl: collection.icon_url || "",
        rank: collection.rank,
        floorPrice: 0,
        listings: 0,
        sales1Day: 0,
        volume1Day: 0,
        volume7Day: 0,
        volumeTotal: 0,
      }),
    );

    const offerState = await DatabaseInstance.$queryRaw<
      {
        container: string;
        floor: bigint;
        listing: bigint;
      }[]
    >`
    SELECT
      container,
      MIN(price) as floor,
      COUNT(*) as listing
    FROM atomical_offer
    WHERE status = 1
      AND type = 2
    GROUP BY container
    `;

    for (const collection of response) {
      if (offerState && offerState.length > 0) {
        const offerStateMatch = offerState.find(
          (c) => c.container === collection.container,
        );
        if (offerStateMatch) {
          collection.floorPrice = offerStateMatch.floor
            ? parseInt(offerStateMatch.floor.toString() || "0")
            : 0;
          collection.listings = offerStateMatch.listing
            ? parseInt(offerStateMatch.listing.toString() || "0")
            : 0;
        }
      }

      const [volumes, totalVolume, sales] = await Promise.all([
        RedisInstance.mget(
          dates.map(
            (date) =>
              `state:market:volumes:container:${collection.container}:${date}`,
          ),
        ),
        RedisInstance.get(
          `state:market:volumes:container:${collection.container}:total`,
        ),
        RedisInstance.mget(
          dates.map(
            (date) =>
              `state:market:sales:container:${collection.container}:${date}`,
          ),
        ),
      ]);

      if (volumes && volumes.length > 0) {
        const volumes1Day = volumes.slice(0, 24);
        collection.volume1Day = volumes1Day.reduce(
          (acc, cur) => (cur ? acc + parseInt(cur) : acc),
          0,
        );
        collection.volume7Day = volumes.reduce(
          (acc, cur) => (cur ? acc + parseInt(cur) : acc),
          0,
        );
      }

      if (totalVolume) {
        collection.volumeTotal = parseInt(totalVolume);
      }

      if (sales && sales.length > 0) {
        const sales1Day = sales.slice(0, 24);
        collection.sales1Day = sales1Day.reduce(
          (acc, cur) => (cur ? acc + parseInt(cur) : acc),
          0,
        );
      }
    }

    RedisInstance.set(
      "cache:market:state:collections",
      JSON.stringify(response),
      "EX",
      60 * 5,
      "NX",
    );

    return json({
      data: response,
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

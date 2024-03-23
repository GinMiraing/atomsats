import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { CollectionMarketStates } from "@/lib/types/market";
import { getFormattedDatesLastNHours } from "@/lib/utils";
import { errorResponse } from "@/lib/utils/error-helpers";

export const action: ActionFunction = async ({ params }) => {
  try {
    const { container } = params as { container: string };

    const cache = await RedisInstance.get(
      `cache:market:state:collections:${container}`,
    );

    if (cache) {
      return json({
        data: JSON.parse(cache),
        error: false,
        code: 0,
      });
    }

    const dates = getFormattedDatesLastNHours(24 * 7);

    const containerData = await DatabaseInstance.atomical_container.findFirst({
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

    if (!containerData) {
      return json(errorResponse(10002));
    }

    const response: Omit<CollectionMarketStates, "container" | "rank"> = {
      atomicalId: containerData.atomical_id,
      atomicalNumber: containerData.atomical_number,
      name: containerData.name,
      deployTime: containerData.deploy_time,
      itemCount: containerData.item_count,
      mintedCount: containerData.minted_count,
      holders: containerData.holders,
      iconUrl: containerData.icon_url,
      floorPrice: 0,
      listings: 0,
      sales1Day: 0,
      volume1Day: 0,
      volume7Day: 0,
      volumeTotal: 0,
    };

    const offerState = await DatabaseInstance.$queryRaw<
      {
        container: string;
        floor: bigint;
        listing: bigint;
      }[]
    >`
    SELECT
      MIN(price) as floor,
      COUNT(*) as listing
    FROM atomical_offer
    WHERE status = 1
      AND type = 2
      AND container = ${container}
    `;

    if (offerState && offerState.length > 0) {
      const state = offerState[0];

      response.floorPrice = state.floor
        ? parseInt(state.floor.toString() || "0")
        : 0;
      response.listings = state.listing
        ? parseInt(state.listing.toString() || "0")
        : 0;
    }

    const [volumes, totalVolume, sales] = await Promise.all([
      RedisInstance.mget(
        dates.map(
          (date) => `state:market:volumes:container:${container}:${date}`,
        ),
      ),
      RedisInstance.get(`state:market:volumes:container:${container}:total`),
      RedisInstance.mget(
        dates.map(
          (date) => `state:market:sales:container:${container}:${date}`,
        ),
      ),
    ]);

    if (volumes && volumes.length > 0) {
      const volumes1Day = volumes.slice(0, 24);
      response.volume1Day = volumes1Day.reduce(
        (acc, cur) => (cur ? acc + parseInt(cur) : acc),
        0,
      );
      response.volume7Day = volumes.reduce(
        (acc, cur) => (cur ? acc + parseInt(cur) : acc),
        0,
      );
    }

    if (totalVolume) {
      response.volumeTotal = parseInt(totalVolume);
    }

    if (sales && sales.length > 0) {
      const sales1Day = sales.slice(0, 24);
      response.sales1Day = sales1Day.reduce(
        (acc, cur) => (cur ? acc + parseInt(cur) : acc),
        0,
      );
    }

    RedisInstance.set(
      `cache:market:state:collections:${container}`,
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

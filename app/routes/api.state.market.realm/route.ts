import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { RealmMarketStates } from "@/lib/types/market";
import { getFormattedDatesLastNHours } from "@/lib/utils";
import { errorResponse } from "@/lib/utils/error-helpers";

export const action: ActionFunction = async () => {
  try {
    const dates = getFormattedDatesLastNHours(24 * 7);

    const response: RealmMarketStates = {
      floorPrice: 0,
      listings: 0,
      sales1Day: 0,
      volume1Day: 0,
      volume7Day: 0,
      volumeTotal: 0,
    };

    const offerState = await DatabaseInstance.$queryRaw<
      {
        floor: bigint;
        listing: bigint;
      }[]
    >`
    SELECT
      MIN(price) as floor,
      COUNT(*) as listing
    FROM atomical_offer
    WHERE status = 1
      AND type = 1
    `;

    if (offerState && offerState.length > 0) {
      const state = offerState[0];

      response.floorPrice = parseInt(state.floor?.toString() || "0");
      response.listings = parseInt(state.listing?.toString() || "0");
    }

    const [volumes, totalVolume, sales] = await Promise.all([
      RedisInstance.mget(
        dates.map((date) => `state:market:volumes:realm:${date}`),
      ),
      RedisInstance.get(`state:market:volumes:realm:total`),
      RedisInstance.mget(
        dates.map((date) => `state:market:sales:realm:${date}`),
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

    return json({
      data: response,
      error: false,
      code: 0,
    });
  } catch (e) {
    return json(errorResponse(20001));
  }
};

import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";

import { AccountOffer } from "../address.$address/types";

export const action: ActionFunction = async ({ params }) => {
  const { address } = params as { address: string };

  try {
    const offers = await DatabaseInstance.atomical_offer.findMany({
      select: {
        id: true,
        atomical_id: true,
        atomical_number: true,
        funding_receiver: true,
        price: true,
        type: true,
        realm: true,
        dmitem: true,
        container: true,
        description: true,
      },
      where: {
        status: 1,
        list_account: address,
      },
    });

    const response: AccountOffer[] = offers.map((offer) => ({
      id: offer.id,
      atomicalId: offer.atomical_id,
      atomicalNumber: offer.atomical_number,
      type: offer.type === 1 ? "realm" : "dmitem",
      price: parseInt(offer.price.toString()),
      receiver: offer.funding_receiver,
      favorAddress: [],
      realm: offer.realm || "",
      dmitem: offer.dmitem || "",
      container: offer.container || "",
      description: offer.description || "",
    }));

    const favorAddressList = await Promise.all(
      response.map((offer) =>
        RedisInstance.smembers(`offer:favors:${offer.id}`),
      ),
    );

    for (let i = 0; i < response.length; i++) {
      response[i].favorAddress =
        favorAddressList[i].length > 0 ? favorAddressList[i] : [];
    }

    return json({
      data: response,
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json({
      data: null,
      error: true,
      code: 20001,
    });
  }
};

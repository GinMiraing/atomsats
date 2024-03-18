import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";

export const action: ActionFunction = async ({ params }) => {
  const { address } = params as { address: string };

  try {
    const offers = await DatabaseInstance.atomical_offer.findMany({
      select: {
        atomical_id: true,
        funding_receiver: true,
        price: true,
      },
      where: {
        status: 1,
        list_account: address,
      },
    });

    return json({
      data: offers.map((offer) => ({
        atomicalId: offer.atomical_id,
        price: parseInt(offer.price.toString()),
        receiver: offer.funding_receiver,
      })),
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

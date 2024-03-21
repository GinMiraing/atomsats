import { Prisma } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  market: z.enum(["realm", "dmitem"]),
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
  container: z.string().optional(),
});

type SchemaType = z.infer<typeof Schema>;

export const action: ActionFunction = async ({ request }) => {
  try {
    const data: SchemaType = await request.json();

    try {
      Schema.parse(data);
    } catch (e) {
      return json(errorResponse(10001));
    }

    if (data.market === "dmitem" && !data.container) {
      return json(errorResponse(10001));
    }

    const whereClause: Prisma.atomical_orderWhereInput = {
      type: data.market === "realm" ? 1 : 2,
      status: 1,
      container: data.container,
    };

    const [orders, count] = await DatabaseInstance.$transaction([
      DatabaseInstance.atomical_order.findMany({
        select: {
          id: true,
          atomical_id: true,
          atomical_number: true,
          price: true,
          list_account: true,
          item_receiver: true,
          tx: true,
          create_at: true,
          realm: data.market === "realm" ? true : undefined,
        },
        where: whereClause,
        orderBy: [
          {
            id: "desc",
          },
        ],
        take: data.limit,
        skip: data.offset,
      }),
      DatabaseInstance.atomical_order.count({
        where: whereClause,
      }),
    ]);

    return {
      data: {
        orders: orders.map((order) => ({
          id: order.id,
          atomicalId: order.atomical_id,
          lister: order.list_account,
          itemReceiver: order.item_receiver,
          atomicalNumber: order.atomical_number,
          type: data.market,
          price: parseInt(order.price.toString()),
          tx: order.tx,
          createAt: order.create_at,
          realm: order.realm || "",
        })),
        count,
      },
      error: false,
      code: 0,
    };
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

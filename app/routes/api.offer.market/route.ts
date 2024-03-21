import { Prisma } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  market: z.enum(["realm", "dmitem", "all"]),
  limit: z.number().int().min(1).max(30),
  offset: z.number().int().min(0),
  container: z.string().optional(),
  sort: z.enum([
    "price:asc",
    "price:desc",
    "number:asc",
    "number:desc",
    "id:asc",
    "id:desc",
  ]),
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

    const selectClause: Prisma.atomical_offerSelect = {
      id: true,
      list_account: true,
      atomical_id: true,
      atomical_number: true,
      type: true,
      price: true,
    };

    if (data.market === "realm") {
      selectClause.realm = true;
    } else if (data.market === "all") {
      selectClause.realm = true;
      selectClause.dmitem = true;
      selectClause.container = true;
    } else if (data.market === "dmitem") {
      selectClause.dmitem = true;
    }

    const whereClause: Prisma.atomical_offerWhereInput = {
      type:
        data.market === "realm" ? 1 : data.market === "dmitem" ? 2 : undefined,
      status: 1,
      container: data.container,
    };

    const orderByClause: Prisma.atomical_offerOrderByWithAggregationInput[] =
      [];

    switch (data.sort) {
      case "id:asc":
        orderByClause.push({
          id: "asc",
        });
        break;
      case "id:desc":
        orderByClause.push({
          id: "desc",
        });
        break;
      case "number:asc":
        orderByClause.push({
          atomical_number: "asc",
        });
        break;
      case "number:desc":
        orderByClause.push({
          atomical_number: "desc",
        });
        break;
      case "price:asc":
        orderByClause.push({
          price: "asc",
        });
        orderByClause.push({
          id: "desc",
        });
        break;
      case "price:desc":
        orderByClause.push({
          price: "desc",
        });
        orderByClause.push({
          id: "desc",
        });
        break;
    }

    const [offers, count] = await DatabaseInstance.$transaction([
      DatabaseInstance.atomical_offer.findMany({
        select: selectClause,
        where: whereClause,
        orderBy: orderByClause,
        take: data.limit,
        skip: data.offset,
      }),
      DatabaseInstance.atomical_offer.count({
        where: whereClause,
      }),
    ]);

    return {
      data: {
        offers: offers.map((offer) => ({
          id: offer.id,
          lister: offer.list_account,
          atomicalId: offer.atomical_id,
          atomicalNumber: offer.atomical_number,
          type: offer.type === 1 ? "realm" : "dmitem",
          price: parseInt(offer.price.toString()),
          realm: offer.realm || "",
          dmitem: offer.dmitem || "",
          container: offer.container || "",
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

import { Prisma } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import RedisInstance from "@/lib/server/redis.server";
import { OfferSummary } from "@/lib/types/market";
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
  realmFilters: z
    .object({
      name: z.string().optional(),
      maxLength: z.number().int().min(0).optional(),
      minLength: z.number().int().min(0).optional(),
      maxPrice: z.number().int().min(0).optional(),
      minPrice: z.number().int().min(0).optional(),
      punycode: z.boolean().optional(),
    })
    .optional(),
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

    const [offers, count] = await DatabaseInstance.$transaction([
      DatabaseInstance.$queryRaw<
        {
          id: number;
          list_account: string;
          atomical_id: string;
          atomical_number: bigint;
          type: number;
          price: bigint;
          realm?: string;
          dmitem?: string;
          container?: string;
          description?: string;
        }[]
      >`SELECT
          id,
          list_account,
          atomical_id,
          atomical_number,
          type,
          description,
          ${
            data.market === "realm"
              ? Prisma.sql`realm,`
              : data.market === "dmitem"
                ? Prisma.sql`dmitem,`
                : Prisma.sql`realm, dmitem, container,`
          }
          price
        FROM atomical_offer
        WHERE status = 1
          ${
            data.market === "realm"
              ? Prisma.sql`AND type = 1`
              : data.market === "dmitem"
                ? Prisma.sql`AND type = 2`
                : Prisma.empty
          }
          ${
            data.container && data.market === "dmitem"
              ? Prisma.sql`AND container = ${data.container}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.name && data.market === "realm"
              ? Prisma.sql`AND realm LIKE ${`%${data.realmFilters.name}%`}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.minLength && data.market === "realm"
              ? Prisma.sql`AND CHAR_LENGTH(realm) >= ${data.realmFilters.minLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.maxLength && data.market === "realm"
              ? Prisma.sql`AND CHAR_LENGTH(realm) <= ${data.realmFilters.maxLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.minPrice && data.market === "realm"
              ? Prisma.sql`AND price >= ${data.realmFilters.minPrice}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.maxPrice && data.market === "realm"
              ? Prisma.sql`AND price <= ${data.realmFilters.maxPrice}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.punycode && data.market === "realm"
              ? Prisma.sql`AND realm LIKE 'xn--%'`
              : Prisma.empty
          }
        ORDER BY ${
          data.sort === "id:asc"
            ? Prisma.sql`id ASC`
            : data.sort === "id:desc"
              ? Prisma.sql`id DESC`
              : data.sort === "number:asc"
                ? Prisma.sql`atomical_number ASC`
                : data.sort === "number:desc"
                  ? Prisma.sql`atomical_number DESC`
                  : data.sort === "price:asc"
                    ? Prisma.sql`price ASC, id DESC`
                    : data.sort === "price:desc"
                      ? Prisma.sql`price DESC, id DESC`
                      : Prisma.sql`id DESC`
        }
        LIMIT ${data.limit}
        OFFSET ${data.offset}`,
      DatabaseInstance.$queryRaw<{ count: bigint }[]>`
        SELECT
          COUNT(*) AS count
        FROM atomical_offer
        WHERE status = 1
          ${
            data.market === "realm"
              ? Prisma.sql`AND type = 1`
              : data.market === "dmitem"
                ? Prisma.sql`AND type = 2`
                : Prisma.empty
          }
          ${
            data.container && data.market === "dmitem"
              ? Prisma.sql`AND container = ${data.container}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.name && data.market === "realm"
              ? Prisma.sql`AND realm LIKE ${`%${data.realmFilters.name}%`}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.minLength && data.market === "realm"
              ? Prisma.sql`AND CHAR_LENGTH(realm) >= ${data.realmFilters.minLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.maxLength && data.market === "realm"
              ? Prisma.sql`AND CHAR_LENGTH(realm) <= ${data.realmFilters.maxLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.minPrice && data.market === "realm"
              ? Prisma.sql`AND price >= ${data.realmFilters.minPrice}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.maxPrice && data.market === "realm"
              ? Prisma.sql`AND price <= ${data.realmFilters.maxPrice}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.punycode && data.market === "realm"
              ? Prisma.sql`AND realm LIKE 'xn--%'`
              : Prisma.empty
          }
      `,
    ]);

    const response: {
      offers: OfferSummary[];
      count: number;
    } = {
      offers: offers.map((offer) => ({
        id: offer.id,
        lister: offer.list_account,
        atomicalId: offer.atomical_id,
        atomicalNumber: parseInt(offer.atomical_number.toString()),
        type: offer.type === 1 ? "realm" : "dmitem",
        price: parseInt(offer.price.toString()),
        realm: offer.realm || "",
        dmitem: offer.dmitem || "",
        container: offer.container || data.container || "",
        description: offer.description || "",
        favorAddress: [],
      })),
      count: count.length > 0 ? parseInt(count[0].count.toString()) : 0,
    };

    const favorAddressList = await Promise.all(
      response.offers.map((offer) =>
        RedisInstance.smembers(`offer:favors:${offer.id}`),
      ),
    );

    for (let i = 0; i < response.offers.length; i++) {
      response.offers[i].favorAddress =
        favorAddressList[i].length > 0 ? favorAddressList[i] : [];
    }

    return {
      data: response,
      error: false,
      code: 0,
    };
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

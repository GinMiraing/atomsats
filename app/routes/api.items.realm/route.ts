import { Prisma } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  limit: z.number().int().min(1).max(30),
  offset: z.number().int().min(0),
  sort: z.enum(["number:asc", "number:desc"]),
  realmFilters: z
    .object({
      name: z.string().optional(),
      maxLength: z.number().int().min(0).optional(),
      minLength: z.number().int().min(0).optional(),
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

    const [realms, count] = await DatabaseInstance.$transaction([
      DatabaseInstance.$queryRaw<
        {
          id: number;
          atomical_id: string;
          atomical_number: bigint;
          name: string;
          mint_time: bigint;
        }[]
      >`SELECT
          id,
          atomical_id,
          atomical_number,
          name,
          mint_time
        FROM atomical_realm
        WHERE status = 1
          ${
            data.realmFilters?.name
              ? Prisma.sql`AND name LIKE ${`%${data.realmFilters.name}%`}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.minLength
              ? Prisma.sql`AND CHAR_LENGTH(name) >= ${data.realmFilters.minLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.maxLength
              ? Prisma.sql`AND CHAR_LENGTH(name) <= ${data.realmFilters.maxLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.punycode
              ? Prisma.sql`AND name LIKE 'xn--%'`
              : Prisma.empty
          }
        ORDER BY ${
          data.sort === "number:asc"
            ? Prisma.sql`atomical_number ASC`
            : data.sort === "number:desc"
              ? Prisma.sql`atomical_number DESC`
              : Prisma.sql`id DESC`
        }
        LIMIT ${data.limit}
        OFFSET ${data.offset}`,
      DatabaseInstance.$queryRaw<{ count: bigint }[]>`
        SELECT
          COUNT(*) AS count
        FROM atomical_realm
        WHERE status = 1
          ${
            data.realmFilters?.name
              ? Prisma.sql`AND name LIKE ${`%${data.realmFilters.name}%`}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.minLength
              ? Prisma.sql`AND CHAR_LENGTH(name) >= ${data.realmFilters.minLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.maxLength
              ? Prisma.sql`AND CHAR_LENGTH(name) <= ${data.realmFilters.maxLength}`
              : Prisma.empty
          }
          ${
            data.realmFilters?.punycode
              ? Prisma.sql`AND name LIKE 'xn--%'`
              : Prisma.empty
          }
      `,
    ]);

    return json({
      data: {
        realms: realms.map((realm) => ({
          id: realm.id,
          atomicalId: realm.atomical_id,
          atomicalNumber: parseInt(realm.atomical_number.toString()),
          name: realm.name,
          mintTime: parseInt(realm.mint_time.toString()),
        })),
        count: count.length > 0 ? parseInt(count[0].count.toString()) : 0,
      },
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

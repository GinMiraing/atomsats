import { Prisma } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  realm: z.string(),
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

    const realms = await DatabaseInstance.$queryRaw<
      {
        atomical_id: string;
        atomical_number: bigint;
        name: string;
      }[]
    >(Prisma.sql`
      SELECT
        atomical_id,
        atomical_number,
        name
      FROM atomical_realm
      WHERE status = 1
        AND name like ${`'%${data.realm || ""}%'`}
      ORDER BY atomical_number DESC
      LIMIT 15
    `);

    return json({
      data: realms.map((realm) => ({
        atomicalId: realm.atomical_id,
        atomicalNumber: parseInt(realm.atomical_number.toString()),
        name: realm.name,
      })),
      error: null,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

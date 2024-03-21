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
      select
        atomical_id,
        atomical_number,
        name
      from atomical_realm
      where name like ${`%${data.realm || ""}%`}
        and status = 1
      order by atomical_number desc
      limit 15
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

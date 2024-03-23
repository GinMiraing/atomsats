import { ActionFunction, json } from "@remix-run/node";
import { z } from "zod";

import DatabaseInstance from "@/lib/server/prisma.server";
import { errorResponse } from "@/lib/utils/error-helpers";

const Schema = z.object({
  container: z.string(),
  limit: z.number().int().min(1).max(30),
  offset: z.number().int().min(0),
  sort: z.enum(["number:asc", "number:desc", "dmitem:asc", "dmitem:desc"]),
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

    const [dmitems, count] = await DatabaseInstance.$transaction([
      DatabaseInstance.atomical_dmitem.findMany({
        select: {
          id: true,
          atomical_id: true,
          atomical_number: true,
          dmitem: true,
          mint_time: true,
        },
        where: {
          status: 1,
          container: data.container,
        },
        orderBy: [
          data.sort === "number:asc"
            ? {
                atomical_number: "asc",
              }
            : data.sort === "number:desc"
              ? {
                  atomical_number: "desc",
                }
              : data.sort === "dmitem:asc"
                ? {
                    dmitem: "asc",
                  }
                : data.sort === "dmitem:desc"
                  ? {
                      dmitem: "desc",
                    }
                  : {
                      id: "desc",
                    },
        ],
        take: data.limit,
        skip: data.offset,
      }),
      DatabaseInstance.atomical_dmitem.count({
        where: {
          status: 1,
          container: data.container,
        },
      }),
    ]);

    return json({
      data: {
        dmitems: dmitems.map((dmitem) => ({
          id: dmitem.id,
          atomicalId: dmitem.atomical_id,
          atomicalNumber: dmitem.atomical_number,
          dmitem: dmitem.dmitem,
          mintTime: dmitem.mint_time,
        })),
        count,
      },
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

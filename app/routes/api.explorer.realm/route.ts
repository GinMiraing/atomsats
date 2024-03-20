import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";
import { errorResponse } from "@/lib/utils/error-helpers";

export const action: ActionFunction = async () => {
  try {
    const realms = await DatabaseInstance.atomical_realm.findMany({
      select: {
        atomical_id: true,
        atomical_number: true,
        name: true,
        mint_time: true,
      },
      where: {
        status: 1,
      },
      orderBy: [
        {
          atomical_number: "desc",
        },
      ],
      take: 100,
    });

    return json({
      data: realms.map((realm) => ({
        atomicalId: realm.atomical_id,
        atomicalNumber: realm.atomical_number,
        name: realm.name,
        mintTime: realm.mint_time,
      })),
      error: false,
      code: 0,
    });
  } catch (e) {
    return json(errorResponse(20001));
  }
};

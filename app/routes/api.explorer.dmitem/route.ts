import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";
import { errorResponse } from "@/lib/utils/error-helpers";

export const action: ActionFunction = async () => {
  try {
    const dmitems = await DatabaseInstance.atomical_dmitem.findMany({
      select: {
        atomical_id: true,
        atomical_number: true,
        mint_time: true,
        container: true,
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
      data: dmitems.map((dmitem) => ({
        atomicalId: dmitem.atomical_id,
        atomicalNumber: dmitem.atomical_number,
        mintTime: dmitem.mint_time,
        container: dmitem.container,
      })),
      error: false,
      code: 0,
    });
  } catch (e) {
    console.log(e);
    return json(errorResponse(20001));
  }
};

import { ActionFunction, json } from "@remix-run/node";

import DatabaseInstance from "@/lib/server/prisma.server";

export const action: ActionFunction = async ({ params }) => {
  const { container } = params as { container: string };

  try {
    const items = await DatabaseInstance.atomical_dmitem.findMany({
      select: {
        atomical_id: true,
        atomical_number: true,
        dmitem: true,
        mint_time: true,
      },
      where: {
        container,
        status: 1,
      },
      orderBy: [
        {
          atomical_number: "asc",
        },
      ],
    });

    return json({
      data: items.map((dmitem) => ({
        atomicalId: dmitem.atomical_id,
        atomicalNumber: dmitem.atomical_number,
        dmitem: dmitem.dmitem,
        mintTime: dmitem.mint_time,
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

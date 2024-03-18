import { ActionFunction, json } from "@remix-run/node";

import RedisInstance from "@/lib/server/redis.server";

export const action: ActionFunction = async ({ request }) => {
  try {
    const { hash } = (await request.json()) as { hash: string };

    await RedisInstance.set(
      `offer:lock:create:${hash}`,
      "1",
      "EX",
      60 * 30,
      "NX",
    );

    return json({
      data: null,
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

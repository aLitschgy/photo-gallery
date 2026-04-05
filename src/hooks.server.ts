import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { AUTH_COOKIE_NAME } from "$lib/server/config/config";
import { getUserFromToken } from "$lib/server/middleware/auth";

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(AUTH_COOKIE_NAME);
  event.locals.user = token ? getUserFromToken(token) : null;

  if (event.url.pathname.startsWith("/admin") && !event.locals.user) {
    throw redirect(303, "/login");
  }

  return resolve(event);
};

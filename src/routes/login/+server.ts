import jwt from "jsonwebtoken";
import {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_SECURE_OVERRIDE,
  PASSWORD,
  SESSION_SECRET,
} from "$lib/server/config/config";
import { json, type RequestEvent } from "@sveltejs/kit";

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    const firstProto = forwardedProto.split(",")[0]?.trim().toLowerCase();
    return firstProto === "https";
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).protocol === "https:";
    } catch {
      // Ignore malformed Origin and continue fallbacks.
    }
  }

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).protocol === "https:";
    } catch {
      // Ignore malformed Referer and continue fallback.
    }
  }

  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    // Ignore malformed URL edge case.
  }

  return false;
}

export async function POST({ request, cookies }: RequestEvent) {
  const { password } = await request.json();

  if (password === PASSWORD) {
    const token = jwt.sign({ user: "admin" }, SESSION_SECRET, {
      expiresIn: "2h",
    });

    const secureCookie =
      AUTH_COOKIE_SECURE_OVERRIDE ?? isSecureRequest(request);

    cookies.set(AUTH_COOKIE_NAME, token, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: secureCookie,
      maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
    });

    return json({ success: true });
  }

  return json({ error: "Mot de passe incorrect" }, { status: 401 });
}

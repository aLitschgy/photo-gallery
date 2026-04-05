import jwt from "jsonwebtoken";
import { SESSION_SECRET } from "$lib/server/config/config";

type AuthTokenPayload = jwt.JwtPayload & {
  user?: string;
};

export function getUserFromToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, SESSION_SECRET) as AuthTokenPayload;
    return typeof payload.user === "string" && payload.user.length > 0
      ? payload.user
      : null;
  } catch {
    return null;
  }
}

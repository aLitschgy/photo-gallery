import jwt from "jsonwebtoken";
import { json } from "@sveltejs/kit";

import type { RequestEvent } from "@sveltejs/kit";
import { SESSION_SECRET } from "../../../lib/server/config/config";

export async function GET({ request }: RequestEvent) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Token manquant" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  try {
    if (!SESSION_SECRET) {
      return json({ error: "SESSION_SECRET non défini" }, { status: 500 });
    }
    jwt.verify(token, SESSION_SECRET);
    return json({ valid: true });
  } catch (err) {
    return json({ error: "Token invalide" }, { status: 401 });
  }
}

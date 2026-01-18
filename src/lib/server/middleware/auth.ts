import jwt from "jsonwebtoken";
import { SESSION_SECRET } from "$lib/server/config/config";
import { json } from "@sveltejs/kit";

export function verifyAuth(request: {
  headers: { get: (arg0: string) => any };
}) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Token manquant" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, SESSION_SECRET);
    return null; // No error
  } catch (err) {
    return json({ error: "Token invalide" }, { status: 401 });
  }
}

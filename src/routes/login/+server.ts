import jwt from "jsonwebtoken";
import { PASSWORD, SESSION_SECRET } from "$lib/server/config/config";
import { json, type RequestEvent } from "@sveltejs/kit";

export async function POST({ request }: RequestEvent) {
  const { password } = await request.json();

  if (password === PASSWORD) {
    const token = jwt.sign({ user: "admin" }, SESSION_SECRET, {
      expiresIn: "2h",
    });
    return json({ token });
  }

  return json({ error: "Mot de passe incorrect" }, { status: 401 });
}

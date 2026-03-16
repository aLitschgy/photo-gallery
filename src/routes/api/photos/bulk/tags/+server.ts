import { addTagToPhoto } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

/** POST - Associe un tag à plusieurs photos */
export async function POST({ request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const { filenames, tagId } = await request.json();

    if (
      !Array.isArray(filenames) ||
      filenames.length === 0 ||
      !filenames.every((f) => typeof f === "string" && f.trim().length > 0)
    ) {
      return json(
        { error: "La liste des fichiers est invalide" },
        { status: 400 },
      );
    }

    if (typeof tagId !== "number") {
      return json({ error: "ID de tag requis" }, { status: 400 });
    }

    for (const filename of filenames) {
      addTagToPhoto(filename, tagId);
    }

    return json({ success: true, updated: filenames.length });
  } catch (err: any) {
    console.error("Erreur lors de l'ajout du tag en lot:", err);

    if (err.code === "SQLITE_CONSTRAINT") {
      return json({ error: "Photo ou tag inexistant" }, { status: 404 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

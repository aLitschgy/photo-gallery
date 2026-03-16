import { setPhotoHidden } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

/** PUT - Active ou désactive le tag _hidden sur plusieurs photos */
export async function PUT({ request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const { filenames, hidden } = await request.json();

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

    if (typeof hidden !== "boolean") {
      return json(
        { error: "Le paramètre 'hidden' doit être un booléen" },
        { status: 400 },
      );
    }

    for (const filename of filenames) {
      setPhotoHidden(filename, hidden);
    }

    return json({ success: true, updated: filenames.length });
  } catch (err: any) {
    console.error("Erreur lors du changement de visibilité en lot:", err);

    if (err.message?.includes("non trouvée")) {
      return json({ error: err.message }, { status: 404 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

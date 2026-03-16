import { setPhotoHidden } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

/** PUT - Active ou désactive le tag système _hidden sur une photo */
export async function PUT({ params, request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const filename = params.filename;
    const { hidden } = await request.json();

    if (!filename) {
      return json({ error: "Nom de fichier requis" }, { status: 400 });
    }

    if (typeof hidden !== "boolean") {
      return json(
        { error: "Le paramètre 'hidden' doit être un booléen" },
        { status: 400 },
      );
    }

    setPhotoHidden(filename, hidden);

    console.log(`Photo ${filename} ${hidden ? "cachée" : "visible"}`);

    return json({ success: true });
  } catch (err: any) {
    console.error("Erreur lors du changement de visibilité:", err);

    if (err.message?.includes("non trouvée")) {
      return json({ error: err.message }, { status: 404 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

import { deleteTag } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";

/** DELETE - Supprime un tag */
export async function DELETE({ params, request }) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const tagId = parseInt(params.id);

    if (isNaN(tagId)) {
      return json({ error: "ID de tag invalide" }, { status: 400 });
    }

    const deleted = deleteTag(tagId);

    if (!deleted) {
      return json({ error: "Tag non trouvé" }, { status: 404 });
    }

    console.log(`Tag supprimé: ${tagId}`);

    return json({ success: true });
  } catch (err: any) {
    console.error("Erreur lors de la suppression du tag:", err);

    // Si le tag est utilisé par des photos
    if (err.message?.includes("Impossible de supprimer")) {
      return json({ error: err.message }, { status: 409 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

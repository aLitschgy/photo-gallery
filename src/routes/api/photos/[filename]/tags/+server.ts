import {
  addTagToPhoto,
  removeTagFromPhoto,
  getPhotoTags,
} from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";

/** GET - Récupère tous les tags d'une photo */
export async function GET({ params }: RequestEvent) {
  try {
    const filename = params.filename;

    if (!filename) {
      return json({ error: "Nom de fichier requis" }, { status: 400 });
    }

    const tags = getPhotoTags(filename);

    return json({ tags });
  } catch (err) {
    console.error("Erreur lors de la récupération des tags de la photo:", err);
    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** POST - Associe un tag à une photo */
export async function POST({ params, request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const filename = params.filename;
    const { tagId } = await request.json();

    if (!filename) {
      return json({ error: "Nom de fichier requis" }, { status: 400 });
    }

    if (!tagId || typeof tagId !== "number") {
      return json({ error: "ID de tag requis" }, { status: 400 });
    }

    addTagToPhoto(filename, tagId);

    console.log(`Tag ${tagId} ajouté à la photo ${filename}`);

    return json({ success: true });
  } catch (err: any) {
    console.error("Erreur lors de l'ajout du tag à la photo:", err);

    // Gestion des erreurs de clés étrangères
    if (err.code === "SQLITE_CONSTRAINT") {
      return json({ error: "Photo ou tag inexistant" }, { status: 404 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** DELETE - Retire un tag d'une photo */
export async function DELETE({ params, request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const filename = params.filename;
    const url = new URL(request.url);
    const tagId = parseInt(url.searchParams.get("tagId") || "");

    if (!filename) {
      return json({ error: "Nom de fichier requis" }, { status: 400 });
    }

    if (isNaN(tagId)) {
      return json({ error: "ID de tag requis" }, { status: 400 });
    }

    const removed = removeTagFromPhoto(filename, tagId);

    if (!removed) {
      return json({ error: "Association non trouvée" }, { status: 404 });
    }

    console.log(`Tag ${tagId} retiré de la photo ${filename}`);

    return json({ success: true });
  } catch (err) {
    console.error("Erreur lors du retrait du tag de la photo:", err);
    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

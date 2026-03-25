import { createTag, deleteTag, getAllTags } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";

/** GET - Récupère tous les tags */
export async function GET() {
  try {
    const tags = getAllTags().filter((t) => !t.name.startsWith("_"));
    return json({ tags });
  } catch (err) {
    console.error("Erreur lors de la récupération des tags:", err);
    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** POST - Crée un nouveau tag */
export async function POST({ request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return json({ error: "Le nom du tag est requis" }, { status: 400 });
    }

    const tag = createTag(name.trim());

    console.log(`Tag créé: ${tag.name} (id: ${tag.id})`);

    return json({
      success: true,
      tag,
    });
  } catch (err: any) {
    console.error("Erreur lors de la création du tag:", err);

    if (err.message?.startsWith("Nom de tag invalide")) {
      return json({ error: err.message }, { status: 400 });
    }

    if (err.message === "Ce tag existe déjà") {
      return json({ error: "Ce tag existe déjà" }, { status: 409 });
    }

    // Gestion de l'erreur de contrainte unique (tag déjà existant)
    if (err.code === "SQLITE_CONSTRAINT" || err.message?.includes("UNIQUE")) {
      return json({ error: "Ce tag existe déjà" }, { status: 409 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** DELETE - Supprime un tag par id */
export async function DELETE({ request }: RequestEvent) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const { tagId } = await request.json();

    if (!Number.isInteger(tagId) || tagId <= 0) {
      return json({ error: "tagId invalide" }, { status: 400 });
    }

    const deleted = deleteTag(tagId);
    if (!deleted) {
      return json({ error: "Tag introuvable" }, { status: 404 });
    }

    return json({ success: true });
  } catch (err: any) {
    console.error("Erreur lors de la suppression du tag:", err);

    if (err.message?.startsWith("Impossible de supprimer le tag")) {
      return json({ error: err.message }, { status: 409 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

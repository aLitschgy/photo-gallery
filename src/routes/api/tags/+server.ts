import { createTag, getAllTags } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";

/** GET - Récupère tous les tags */
export async function GET() {
  try {
    const tags = getAllTags();
    return json({ tags });
  } catch (err) {
    console.error("Erreur lors de la récupération des tags:", err);
    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/** POST - Crée un nouveau tag */
export async function POST({ request }) {
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

    // Gestion de l'erreur de contrainte unique (tag déjà existant)
    if (err.code === "SQLITE_CONSTRAINT" || err.message?.includes("UNIQUE")) {
      return json({ error: "Ce tag existe déjà" }, { status: 409 });
    }

    return json({ error: "Erreur serveur" }, { status: 500 });
  }
}

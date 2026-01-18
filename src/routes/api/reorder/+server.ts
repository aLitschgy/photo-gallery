import { reorderPhoto } from "$lib/server/db/db";
import { verifyAuth } from "$lib/server/middleware/auth";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
  const authError = verifyAuth(request);
  if (authError) return authError;

  try {
    const { filename, prevFilename, nextFilename } = await request.json();

    if (!filename) {
      return json({ error: "filename est requis" }, { status: 400 });
    }

    const updatedPhoto = reorderPhoto(
      filename,
      prevFilename || null,
      nextFilename || null
    );

    console.log(
      `Photo réordonnée: ${filename} -> LexoRank: ${updatedPhoto.lexoRank}`
    );

    return json({
      success: true,
      photo: updatedPhoto,
    });
  } catch (err) {
    console.error("Erreur réordonnancement:", err);
    return json({ error: err.message }, { status: 500 });
  }
}

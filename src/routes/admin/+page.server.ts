import type { Actions, PageServerLoad } from "./$types";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  addPhoto,
  addTagToPhoto,
  createTag,
  deletePhoto as deletePhotoFromDb,
  deleteTag,
  getAllPhotos,
  getAllTags,
  getPhotoTags,
  isPhotoHidden,
  removeTagFromPhoto,
  reorderPhoto,
  setPhotoHidden,
} from "$lib/server/db/db";
import { AUTH_COOKIE_NAME } from "$lib/server/config/config";
import { fail, redirect } from "@sveltejs/kit";

function isFilePresent(filename: string): boolean {
  const staticPath = path.join(process.cwd(), "static", "photos", filename);
  const galleryPath = path.join(
    process.cwd(),
    "gallery-data",
    "photos",
    filename,
  );

  return fs.existsSync(staticPath) || fs.existsSync(galleryPath);
}

function parseStringField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalStringField(
  formData: FormData,
  key: string,
): string | null {
  const value = parseStringField(formData, key);
  return value.length > 0 ? value : null;
}

function parseIntegerField(formData: FormData, key: string): number | null {
  const value = parseStringField(formData, key);
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseBooleanField(formData: FormData, key: string): boolean | null {
  const value = parseStringField(formData, key).toLowerCase();

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return null;
}

function parseFilenameList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);
}

async function pickAvailableName(base: string, ext: string, dir: string) {
  let candidate = `${base}${ext}`;
  let counter = 1;

  while (true) {
    const target = path.join(dir, candidate);
    try {
      await fs.promises.access(target);
      candidate = `${base}-${counter}${ext}`;
      counter += 1;
    } catch {
      return candidate;
    }
  }
}

async function uploadSinglePhoto(file: File) {
  const originalName = file.name;
  const buffer = Buffer.from(await file.arrayBuffer());

  const uploadsDir = path.join(process.cwd(), "uploads");
  const photosDir = path.join(process.cwd(), "gallery-data", "photos");
  const thumbsDir = path.join(photosDir, "minias");

  await fs.promises.mkdir(uploadsDir, { recursive: true });
  await fs.promises.mkdir(photosDir, { recursive: true });
  await fs.promises.mkdir(thumbsDir, { recursive: true });

  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const uniqueName = await pickAvailableName(base, ext, photosDir);

  const tempPath = path.join(uploadsDir, `${Date.now()}-${uniqueName}`);
  const newPath = path.join(photosDir, uniqueName);

  await fs.promises.writeFile(tempPath, buffer);
  await fs.promises.copyFile(tempPath, newPath);
  await fs.promises.unlink(tempPath);

  const thumbName = `${path.basename(uniqueName, ext)}-minia${ext}`;
  const thumbPath = path.join(thumbsDir, thumbName);

  await sharp(newPath).rotate().resize({ height: 1000 }).toFile(thumbPath);

  const metadata = await sharp(newPath).metadata();
  let width = metadata.width;
  let height = metadata.height;

  if (metadata.orientation && [5, 6, 7, 8].includes(metadata.orientation)) {
    [width, height] = [height, width];
  }

  addPhoto(uniqueName, width, height);
}

async function deletePhotoFiles(photoFilename: string) {
  const extIndex = photoFilename.lastIndexOf(".");
  const base =
    extIndex !== -1 ? photoFilename.slice(0, extIndex) : photoFilename;
  const ext = extIndex !== -1 ? photoFilename.slice(extIndex) : "";
  const thumbName = `${base}-minia${ext}`;

  const baseDir = path.join(process.cwd(), "gallery-data", "photos");
  const photoPath = path.join(baseDir, photoFilename);
  const thumbnailPath = path.join(baseDir, "minias", thumbName);

  await fs.promises.unlink(photoPath);
  deletePhotoFromDb(photoFilename);

  try {
    await fs.promises.unlink(thumbnailPath);
  } catch {
    // Thumbnail deletion is best-effort.
  }
}

function ensureAuthenticated(user: string | null) {
  if (!user) {
    return fail(401, { error: "Non authentifie" });
  }

  return null;
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, "/login");
  }

  const photosDB = getAllPhotos();

  const images = photosDB
    .map((photo) => {
      const f = photo.filename;
      if (!isFilePresent(f)) {
        console.warn(`Fichier référencé dans la DB mais absent: ${f}`);
        return null;
      }

      return {
        src: `/photos/${f}`,
        thumb: `/photos/minias/${f.replace(/(\.[^.]*)$/, "-minia$1")}`,
        width: photo.width,
        height: photo.height,
        lexoRank: photo.lexoRank,
        tags: photo.tags || [],
      };
    })
    .filter((p) => p !== null);

  const tags = getAllTags().filter((tag) => !tag.name.startsWith("_"));

  return {
    images,
    tags,
  };
};

export const actions: Actions = {
  getTags: async ({ locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    try {
      const tags = getAllTags().filter((tag) => !tag.name.startsWith("_"));
      return { tags };
    } catch (error) {
      console.error("Erreur chargement tags:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  getPhotoTags: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filename = parseStringField(formData, "filename");

    if (!filename) {
      return fail(400, { error: "Nom de fichier requis" });
    }

    try {
      const tags = getPhotoTags(filename).filter(
        (tag) => !tag.name.startsWith("_"),
      );
      return { tags };
    } catch (error) {
      console.error("Erreur chargement tags photo:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  getPhotoHidden: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filename = parseStringField(formData, "filename");

    if (!filename) {
      return fail(400, { error: "Nom de fichier requis" });
    }

    try {
      return { hidden: isPhotoHidden(filename) };
    } catch (error) {
      console.error("Erreur lecture visibilite photo:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  createTag: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const name = parseStringField(formData, "name");

    if (!name) {
      return fail(400, { error: "Le nom du tag est requis" });
    }

    try {
      const tag = createTag(name);
      return { success: true, tag };
    } catch (error: any) {
      if (error?.message?.startsWith("Nom de tag invalide")) {
        return fail(400, { error: error.message });
      }

      if (
        error?.message === "Ce tag existe déjà" ||
        error?.code === "SQLITE_CONSTRAINT" ||
        error?.message?.includes("UNIQUE")
      ) {
        return fail(409, { error: "Ce tag existe déjà" });
      }

      console.error("Erreur creation tag:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  deleteTag: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const tagId = parseIntegerField(formData, "tagId");

    if (!tagId || tagId <= 0) {
      return fail(400, { error: "tagId invalide" });
    }

    try {
      const deleted = deleteTag(tagId);
      if (!deleted) {
        return fail(404, { error: "Tag introuvable" });
      }

      return { success: true };
    } catch (error: any) {
      if (error?.message?.startsWith("Impossible de supprimer le tag")) {
        return fail(409, { error: error.message });
      }

      console.error("Erreur suppression tag:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  addTagToPhoto: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filename = parseStringField(formData, "filename");
    const tagId = parseIntegerField(formData, "tagId");

    if (!filename) {
      return fail(400, { error: "Nom de fichier requis" });
    }

    if (!tagId || tagId <= 0) {
      return fail(400, { error: "ID de tag requis" });
    }

    try {
      addTagToPhoto(filename, tagId);
      return { success: true };
    } catch (error: any) {
      if (error?.code === "SQLITE_CONSTRAINT") {
        return fail(404, { error: "Photo ou tag inexistant" });
      }

      console.error("Erreur ajout tag photo:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  removeTagFromPhoto: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filename = parseStringField(formData, "filename");
    const tagId = parseIntegerField(formData, "tagId");

    if (!filename) {
      return fail(400, { error: "Nom de fichier requis" });
    }

    if (!tagId || tagId <= 0) {
      return fail(400, { error: "ID de tag requis" });
    }

    try {
      const removed = removeTagFromPhoto(filename, tagId);
      if (!removed) {
        return fail(404, { error: "Association non trouvée" });
      }

      return { success: true };
    } catch (error) {
      console.error("Erreur retrait tag photo:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  setPhotoHidden: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filename = parseStringField(formData, "filename");
    const hidden = parseBooleanField(formData, "hidden");

    if (!filename) {
      return fail(400, { error: "Nom de fichier requis" });
    }

    if (hidden === null) {
      return fail(400, { error: "Le paramètre 'hidden' doit être un booléen" });
    }

    try {
      setPhotoHidden(filename, hidden);
      return { success: true };
    } catch (error: any) {
      if (error?.message?.includes("non trouvée")) {
        return fail(404, { error: error.message });
      }

      console.error("Erreur changement visibilite:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  addTagToPhotosBulk: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filenames = parseFilenameList(formData, "filenames");
    const tagId = parseIntegerField(formData, "tagId");

    if (filenames.length === 0) {
      return fail(400, { error: "La liste des fichiers est invalide" });
    }

    if (!tagId || tagId <= 0) {
      return fail(400, { error: "ID de tag requis" });
    }

    try {
      for (const filename of filenames) {
        addTagToPhoto(filename, tagId);
      }

      return { success: true, updated: filenames.length };
    } catch (error: any) {
      if (error?.code === "SQLITE_CONSTRAINT") {
        return fail(404, { error: "Photo ou tag inexistant" });
      }

      console.error("Erreur ajout tag bulk:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  setPhotosHiddenBulk: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filenames = parseFilenameList(formData, "filenames");
    const hidden = parseBooleanField(formData, "hidden");

    if (filenames.length === 0) {
      return fail(400, { error: "La liste des fichiers est invalide" });
    }

    if (hidden === null) {
      return fail(400, { error: "Le paramètre 'hidden' doit être un booléen" });
    }

    try {
      for (const filename of filenames) {
        setPhotoHidden(filename, hidden);
      }

      return { success: true, updated: filenames.length };
    } catch (error: any) {
      if (error?.message?.includes("non trouvée")) {
        return fail(404, { error: error.message });
      }

      console.error("Erreur visibilite bulk:", error);
      return fail(500, { error: "Erreur serveur" });
    }
  },

  deletePhoto: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filename = parseStringField(formData, "filename");

    if (!filename) {
      return fail(400, { error: "Nom de fichier requis" });
    }

    try {
      await deletePhotoFiles(filename);
      return { success: true };
    } catch (error) {
      console.error("Erreur suppression photo:", error);
      return fail(404, { error: "Photo introuvable" });
    }
  },

  reorderPhoto: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    const formData = await request.formData();
    const filename = parseStringField(formData, "filename");
    const prevFilename = parseOptionalStringField(formData, "prevFilename");
    const nextFilename = parseOptionalStringField(formData, "nextFilename");

    if (!filename) {
      return fail(400, { error: "filename est requis" });
    }

    try {
      const photo = reorderPhoto(filename, prevFilename, nextFilename);
      return { success: true, photo };
    } catch (error: any) {
      console.error("Erreur reordonnancement:", error);
      return fail(500, { error: error?.message || "Erreur serveur" });
    }
  },

  uploadPhoto: async ({ request, locals }) => {
    const authError = ensureAuthenticated(locals.user);
    if (authError) return authError;

    try {
      const formData = await request.formData();
      const files = formData
        .getAll("photo")
        .filter((entry): entry is File => entry instanceof File);

      if (files.length === 0) {
        return fail(400, { error: "Aucun fichier fourni" });
      }

      await Promise.all(files.map((file) => uploadSinglePhoto(file)));
      return { success: true, uploaded: files.length };
    } catch (error) {
      console.error("Erreur upload:", error);
      return fail(500, { error: "Erreur lors de l'upload" });
    }
  },

  logout: async ({ cookies }) => {
    cookies.delete(AUTH_COOKIE_NAME, { path: "/" });
    throw redirect(303, "/login");
  },
};

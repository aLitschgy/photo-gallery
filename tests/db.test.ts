import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  addPhoto,
  deletePhoto,
  getAllPhotos,
  photoExists,
  reorderPhoto,
  createTag,
  deleteTag,
  getAllTags,
  getTagByName,
  addTagToPhoto,
  removeTagFromPhoto,
  getPhotoTags,
  getPhotosByAllTags,
  getPhotosByAnyTag,
  getHomepagePhotos,
  setPhotoHidden,
  HIDDEN_TAG_NAME,
  closeDB,
  runMigrations,
} from "../src/lib/server/db/db.js";

describe("Database Tests", () => {
  let originalDbPath: string | undefined;

  beforeEach(() => {
    // Fermer la connexion existante
    closeDB();

    // Utiliser une base de données en mémoire pour chaque test
    originalDbPath = process.env.DB_PATH;
    process.env.DB_PATH = ":memory:";

    // Appliquer les migrations pour créer le schéma
    runMigrations();
  });

  afterEach(() => {
    // Fermer la connexion
    closeDB();

    // Restaurer le chemin original
    if (originalDbPath !== undefined) {
      process.env.DB_PATH = originalDbPath;
    } else {
      delete process.env.DB_PATH;
    }
  });

  describe("Photos", () => {
    it("devrait ajouter une photo", () => {
      const photo = addPhoto("test1.jpg", 1920, 1080);

      expect(photo.filename).toBe("test1.jpg");
      expect(photo.width).toBe(1920);
      expect(photo.height).toBe(1080);
      expect(photo.lexoRank).toBeDefined();
    });

    it("devrait récupérer toutes les photos triées par lexoRank", () => {
      addPhoto("photo1.jpg", 800, 600);
      addPhoto("photo2.jpg", 1024, 768);
      addPhoto("photo3.jpg", 1920, 1080);

      const photos = getAllPhotos();

      expect(photos).toHaveLength(3);
      expect(photos[0].filename).toBe("photo1.jpg");
      expect(photos[1].filename).toBe("photo2.jpg");
      expect(photos[2].filename).toBe("photo3.jpg");
    });

    it("devrait vérifier si une photo existe", () => {
      addPhoto("exists.jpg", 800, 600);

      expect(photoExists("exists.jpg")).toBe(true);
      expect(photoExists("notexists.jpg")).toBe(false);
    });

    it("devrait supprimer une photo", () => {
      addPhoto("todelete.jpg", 800, 600);
      expect(photoExists("todelete.jpg")).toBe(true);

      const deleted = deletePhoto("todelete.jpg");

      expect(deleted).toBe(true);
      expect(photoExists("todelete.jpg")).toBe(false);
    });

    it("devrait retourner false lors de la suppression d'une photo inexistante", () => {
      const deleted = deletePhoto("notexists.jpg");
      expect(deleted).toBe(false);
    });

    it("devrait réordonner une photo", () => {
      const photo1 = addPhoto("photo1.jpg", 800, 600);
      const photo2 = addPhoto("photo2.jpg", 1024, 768);
      const photo3 = addPhoto("photo3.jpg", 1920, 1080);

      // Déplacer photo3 entre photo1 et photo2
      const reordered = reorderPhoto("photo3.jpg", "photo1.jpg", "photo2.jpg");

      expect(reordered.filename).toBe("photo3.jpg");
      expect(reordered.lexoRank).not.toBe(photo3.lexoRank);

      // Vérifier le nouvel ordre
      const photos = getAllPhotos();
      expect(photos[0].filename).toBe("photo1.jpg");
      expect(photos[1].filename).toBe("photo3.jpg");
      expect(photos[2].filename).toBe("photo2.jpg");
    });

    it("devrait générer des lexoRanks automatiquement", () => {
      const photo1 = addPhoto("auto1.jpg", 800, 600);
      const photo2 = addPhoto("auto2.jpg", 1024, 768);
      const photo3 = addPhoto("auto3.jpg", 1920, 1080);

      expect(photo1.lexoRank).toBeDefined();
      expect(photo2.lexoRank).toBeDefined();
      expect(photo3.lexoRank).toBeDefined();
      expect(photo1.lexoRank).not.toBe(photo2.lexoRank);
      expect(photo2.lexoRank).not.toBe(photo3.lexoRank);
    });
  });

  describe("Tags", () => {
    it("devrait créer un tag", () => {
      const tag = createTag("nature");

      expect(tag.id).toBeDefined();
      expect(tag.name).toBe("nature");
    });

    it("devrait normaliser le nom en minuscules", () => {
      const tag = createTag("  NatURe  ");

      expect(tag.name).toBe("nature");
    });

    it("devrait récupérer tous les tags", () => {
      createTag("nature");
      createTag("urban");
      createTag("portrait");

      const tags = getAllTags();

      expect(tags).toHaveLength(3);
      // Triés par nom
      expect(tags[0].name).toBe("nature");
      expect(tags[1].name).toBe("portrait");
      expect(tags[2].name).toBe("urban");
    });

    it("devrait récupérer un tag par son nom", () => {
      createTag("landscape");

      const tag = getTagByName("landscape");

      expect(tag).toBeDefined();
      expect(tag?.name).toBe("landscape");
    });

    it("devrait récupérer un tag sans sensibilité à la casse", () => {
      createTag("Landscape");

      const tag = getTagByName("lAnDsCaPe");

      expect(tag).toBeDefined();
      expect(tag?.name).toBe("landscape");
    });

    it("devrait refuser les caractères spéciaux dans un tag", () => {
      expect(() => createTag("nature!")).toThrow(/Nom de tag invalide/);
    });

    it("devrait empêcher les doublons insensibles à la casse", () => {
      createTag("Nature");

      expect(() => createTag("nature")).toThrow();
    });

    it("devrait retourner undefined pour un tag inexistant", () => {
      const tag = getTagByName("notexists");
      expect(tag).toBeUndefined();
    });

    it("devrait supprimer un tag non utilisé", () => {
      const tag = createTag("unused");

      const deleted = deleteTag(tag.id);

      expect(deleted).toBe(true);
      expect(getTagByName("unused")).toBeUndefined();
    });

    it("devrait lancer une erreur lors de la suppression d'un tag utilisé", () => {
      const photo = addPhoto("tagged.jpg", 800, 600);
      const tag = createTag("used");
      addTagToPhoto(photo.filename, tag.id);

      expect(() => deleteTag(tag.id)).toThrow(/Impossible de supprimer le tag/);
    });
  });

  describe("Photo-Tags Relations", () => {
    it("devrait affecter un tag à une photo", () => {
      const photo = addPhoto("photo.jpg", 800, 600);
      const tag = createTag("test");

      addTagToPhoto(photo.filename, tag.id);

      const tags = getPhotoTags(photo.filename);
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("test");
    });

    it("devrait gérer plusieurs tags sur une photo", () => {
      const photo = addPhoto("multi.jpg", 800, 600);
      const tag1 = createTag("tag1");
      const tag2 = createTag("tag2");
      const tag3 = createTag("tag3");

      addTagToPhoto(photo.filename, tag1.id);
      addTagToPhoto(photo.filename, tag2.id);
      addTagToPhoto(photo.filename, tag3.id);

      const tags = getPhotoTags(photo.filename);
      expect(tags).toHaveLength(3);
    });

    it("devrait ignorer l'ajout d'un tag déjà présent", () => {
      const photo = addPhoto("duplicate.jpg", 800, 600);
      const tag = createTag("dup");

      addTagToPhoto(photo.filename, tag.id);
      addTagToPhoto(photo.filename, tag.id); // Deuxième fois

      const tags = getPhotoTags(photo.filename);
      expect(tags).toHaveLength(1);
    });

    it("devrait retirer un tag d'une photo", () => {
      const photo = addPhoto("remove.jpg", 800, 600);
      const tag = createTag("removable");
      addTagToPhoto(photo.filename, tag.id);

      const removed = removeTagFromPhoto(photo.filename, tag.id);

      expect(removed).toBe(true);
      const tags = getPhotoTags(photo.filename);
      expect(tags).toHaveLength(0);
    });

    it("devrait récupérer les photos ayant tous les tags (AND)", () => {
      const photo1 = addPhoto("photo1.jpg", 800, 600);
      const photo2 = addPhoto("photo2.jpg", 1024, 768);
      const photo3 = addPhoto("photo3.jpg", 1920, 1080);

      const tagA = createTag("tagA");
      const tagB = createTag("tagB");

      addTagToPhoto(photo1.filename, tagA.id);
      addTagToPhoto(photo1.filename, tagB.id);

      addTagToPhoto(photo2.filename, tagA.id);

      addTagToPhoto(photo3.filename, tagB.id);

      const photos = getPhotosByAllTags([tagA.id, tagB.id]);

      expect(photos).toHaveLength(1);
      expect(photos[0].filename).toBe("photo1.jpg");
    });

    it("devrait récupérer les photos ayant au moins un tag (OR)", () => {
      const photo1 = addPhoto("photo1.jpg", 800, 600);
      const photo2 = addPhoto("photo2.jpg", 1024, 768);
      const photo3 = addPhoto("photo3.jpg", 1920, 1080);

      const tagA = createTag("tagA");
      const tagB = createTag("tagB");

      addTagToPhoto(photo1.filename, tagA.id);
      addTagToPhoto(photo2.filename, tagB.id);

      const photos = getPhotosByAnyTag([tagA.id, tagB.id]);

      expect(photos).toHaveLength(2);
      expect(photos.map((p) => p.filename)).toContain("photo1.jpg");
      expect(photos.map((p) => p.filename)).toContain("photo2.jpg");
    });

    it("devrait retourner un tableau vide pour getPhotosByAnyTag sans tags", () => {
      addPhoto("photo1.jpg", 800, 600);

      const photos = getPhotosByAnyTag([]);

      expect(photos).toHaveLength(0);
    });

    it("devrait retourner toutes les photos pour getPhotosByAllTags sans tags", () => {
      addPhoto("photo1.jpg", 800, 600);
      addPhoto("photo2.jpg", 1024, 768);

      const photos = getPhotosByAllTags([]);

      expect(photos).toHaveLength(2);
    });

    it("devrait cacher une photo sur la page d'accueil avec le tag _hidden", () => {
      const visiblePhoto = addPhoto("visible.jpg", 800, 600);
      const hiddenPhoto = addPhoto("hidden.jpg", 1024, 768);

      setPhotoHidden(hiddenPhoto.filename, true);

      const homepagePhotos = getHomepagePhotos();

      expect(homepagePhotos.map((p) => p.filename)).toContain(
        visiblePhoto.filename,
      );
      expect(homepagePhotos.map((p) => p.filename)).not.toContain(
        hiddenPhoto.filename,
      );
    });

    it("devrait garder une photo _hidden dans les résultats filtrés par un autre tag", () => {
      const hiddenTaggedPhoto = addPhoto("hidden-tagged.jpg", 1200, 800);
      const visibleTaggedPhoto = addPhoto("visible-tagged.jpg", 1200, 800);
      const natureTag = createTag("nature");

      addTagToPhoto(hiddenTaggedPhoto.filename, natureTag.id);
      addTagToPhoto(visibleTaggedPhoto.filename, natureTag.id);
      setPhotoHidden(hiddenTaggedPhoto.filename, true);

      const filteredPhotos = getPhotosByAnyTag([natureTag.id]);

      expect(filteredPhotos.map((p) => p.filename)).toContain(
        hiddenTaggedPhoto.filename,
      );
      expect(filteredPhotos.map((p) => p.filename)).toContain(
        visibleTaggedPhoto.filename,
      );
    });

    it("devrait retirer le tag _hidden quand on ré-affiche une photo", () => {
      const photo = addPhoto("toggle-hidden.jpg", 800, 600);

      setPhotoHidden(photo.filename, true);
      setPhotoHidden(photo.filename, false);

      const tags = getPhotoTags(photo.filename);
      expect(tags.some((tag) => tag.name === HIDDEN_TAG_NAME)).toBe(false);
    });
  });

  describe("Cascade Deletion", () => {
    it("devrait supprimer les relations photo-tag lors de la suppression d'une photo", () => {
      const photo = addPhoto("cascade.jpg", 800, 600);
      const tag = createTag("cascade");
      addTagToPhoto(photo.filename, tag.id);

      deletePhoto(photo.filename);

      const tags = getPhotoTags(photo.filename);
      expect(tags).toHaveLength(0);

      // Le tag devrait toujours exister
      expect(getTagByName("cascade")).toBeDefined();
    });
  });
});

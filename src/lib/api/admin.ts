import { deserialize } from "$app/forms";

interface Tag {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type FailureData = {
  error?: string;
};

const DEFAULT_ERROR_MESSAGE = "Erreur serveur";

async function submitAdminAction<T extends Record<string, unknown> | undefined>(
  actionName: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/admin?/${actionName}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "x-sveltekit-action": "true",
      },
      cache: "no-store",
      body: formData,
    });

    if (response.redirected) {
      if (typeof window !== "undefined") {
        window.location.assign(response.url);
      }

      return {
        success: false,
        error: "Session expirée",
      };
    }

    const result = deserialize<T, FailureData>(await response.text());

    if (result.type === "success") {
      return {
        success: true,
        data: result.data,
      };
    }

    if (result.type === "failure") {
      return {
        success: false,
        error: result.data?.error || DEFAULT_ERROR_MESSAGE,
      };
    }

    if (result.type === "redirect") {
      if (typeof window !== "undefined") {
        window.location.assign(result.location);
      }

      return {
        success: false,
        error: "Session expirée",
      };
    }

    return {
      success: false,
      error: DEFAULT_ERROR_MESSAGE,
    };
  } catch (error) {
    console.error(`Erreur action admin '${actionName}':`, error);
    return {
      success: false,
      error: "Erreur réseau",
    };
  }
}

// ========== TAGS ==========

export async function getAllTags(): Promise<Tag[]> {
  const result = await submitAdminAction<{ tags: Tag[] }>(
    "getTags",
    new FormData(),
  );

  if (!result.success) {
    return [];
  }

  return result.data?.tags || [];
}

export async function createTag(name: string): Promise<ApiResponse<Tag>> {
  const formData = new FormData();
  formData.append("name", name.trim());

  const result = await submitAdminAction<{ success: true; tag: Tag }>(
    "createTag",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors de la création du tag",
    };
  }

  return {
    success: true,
    data: result.data?.tag,
  };
}

export async function deleteTag(tagId: number): Promise<ApiResponse<void>> {
  const formData = new FormData();
  formData.append("tagId", String(tagId));

  const result = await submitAdminAction<{ success: true }>(
    "deleteTag",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors de la suppression du tag",
    };
  }

  return { success: true };
}

// ========== PHOTO TAGS ==========

export async function getPhotoTags(filename: string): Promise<Tag[]> {
  const formData = new FormData();
  formData.append("filename", filename);

  const result = await submitAdminAction<{ tags: Tag[] }>(
    "getPhotoTags",
    formData,
  );

  if (!result.success) {
    return [];
  }

  return result.data?.tags || [];
}

export async function getPhotoHidden(filename: string): Promise<boolean> {
  const formData = new FormData();
  formData.append("filename", filename);

  const result = await submitAdminAction<{ hidden: boolean }>(
    "getPhotoHidden",
    formData,
  );

  if (!result.success) {
    return false;
  }

  return result.data?.hidden === true;
}

export async function addTagToPhoto(
  filename: string,
  tagId: number,
): Promise<ApiResponse<void>> {
  const formData = new FormData();
  formData.append("filename", filename);
  formData.append("tagId", String(tagId));

  const result = await submitAdminAction<{ success: true }>(
    "addTagToPhoto",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors de l'ajout du tag",
    };
  }

  return { success: true };
}

export async function removeTagFromPhoto(
  filename: string,
  tagId: number,
): Promise<ApiResponse<void>> {
  const formData = new FormData();
  formData.append("filename", filename);
  formData.append("tagId", String(tagId));

  const result = await submitAdminAction<{ success: true }>(
    "removeTagFromPhoto",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors du retrait du tag",
    };
  }

  return { success: true };
}

// ========== VISIBILITE ==========

export async function setPhotoHidden(
  filename: string,
  hidden: boolean,
): Promise<ApiResponse<void>> {
  const formData = new FormData();
  formData.append("filename", filename);
  formData.append("hidden", String(hidden));

  const result = await submitAdminAction<{ success: true }>(
    "setPhotoHidden",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors du changement de visibilité",
    };
  }

  return { success: true };
}

export async function addTagToPhotosBulk(
  filenames: string[],
  tagId: number,
): Promise<ApiResponse<void>> {
  const formData = new FormData();
  for (const filename of filenames) {
    formData.append("filenames", filename);
  }
  formData.append("tagId", String(tagId));

  const result = await submitAdminAction<{ success: true }>(
    "addTagToPhotosBulk",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors de l'ajout du tag en lot",
    };
  }

  return { success: true };
}

export async function setPhotosHiddenBulk(
  filenames: string[],
  hidden: boolean,
): Promise<ApiResponse<void>> {
  const formData = new FormData();
  for (const filename of filenames) {
    formData.append("filenames", filename);
  }
  formData.append("hidden", String(hidden));

  const result = await submitAdminAction<{ success: true }>(
    "setPhotosHiddenBulk",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors du changement de visibilité en lot",
    };
  }

  return { success: true };
}

// ========== PHOTOS ==========

export async function uploadPhoto(file: File): Promise<boolean> {
  const formData = new FormData();
  formData.append("photo", file);

  const result = await submitAdminAction<{ success: true }>(
    "uploadPhoto",
    formData,
  );

  return result.success;
}

export async function deletePhoto(
  filename: string,
): Promise<ApiResponse<void>> {
  const formData = new FormData();
  formData.append("filename", filename);

  const result = await submitAdminAction<{ success: true }>(
    "deletePhoto",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors de la suppression",
    };
  }

  return { success: true };
}

export async function reorderPhoto(
  filename: string,
  prevFilename: string | null,
  nextFilename: string | null,
): Promise<ApiResponse<void>> {
  const formData = new FormData();
  formData.append("filename", filename);

  if (prevFilename) {
    formData.append("prevFilename", prevFilename);
  }

  if (nextFilename) {
    formData.append("nextFilename", nextFilename);
  }

  const result = await submitAdminAction<{ success: true }>(
    "reorderPhoto",
    formData,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Erreur lors du réordonnancement",
    };
  }

  return { success: true };
}

// API functions for admin operations

function getToken(): string {
  return localStorage.getItem("token") || "";
}

interface Tag {
  id: number;
  name: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ========== TAGS ==========

export async function getAllTags(): Promise<Tag[]> {
  try {
    const response = await fetch("/api/tags");
    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error("Erreur lors du chargement des tags:", error);
    return [];
  }
}

export async function createTag(name: string): Promise<ApiResponse<Tag>> {
  try {
    const response = await fetch("/api/tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const err = await response.json();
      return {
        success: false,
        error: err.error || "Erreur lors de la création du tag",
      };
    }
  } catch (error) {
    return { success: false, error: "Erreur lors de la création du tag" };
  }
}

// ========== PHOTO TAGS ==========

export async function getPhotoTags(filename: string): Promise<Tag[]> {
  try {
    const response = await fetch(`/api/photos/${filename}/tags`);
    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error("Erreur lors du chargement des tags de la photo:", error);
    return [];
  }
}

export async function addTagToPhoto(
  filename: string,
  tagId: number,
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/photos/${filename}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ tagId }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const err = await response.json();
      return {
        success: false,
        error: err.error || "Erreur lors de l'ajout du tag",
      };
    }
  } catch (error) {
    return { success: false, error: "Erreur lors de l'ajout du tag" };
  }
}

export async function removeTagFromPhoto(
  filename: string,
  tagId: number,
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(
      `/api/photos/${filename}/tags?tagId=${tagId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + getToken(),
        },
      },
    );

    if (response.ok) {
      return { success: true };
    } else {
      const err = await response.json();
      return {
        success: false,
        error: err.error || "Erreur lors du retrait du tag",
      };
    }
  } catch (error) {
    return { success: false, error: "Erreur lors du retrait du tag" };
  }
}

// ========== VISIBILITÉ ==========

export async function setPhotoHidden(
  filename: string,
  hidden: boolean,
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`/api/photos/${filename}/hidden`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ hidden }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const err = await response.json();
      return {
        success: false,
        error: err.error || "Erreur lors du changement de visibilité",
      };
    }
  } catch (error) {
    return { success: false, error: "Erreur lors du changement de visibilité" };
  }
}

// ========== PHOTOS ==========

export async function uploadPhoto(file: File): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getToken(),
      },
      body: formData,
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function deletePhoto(
  filename: string,
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/photo/" + filename, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + getToken(),
      },
    });

    if (response.ok) {
      return { success: true };
    } else {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        error: err.error || "Erreur lors de la suppression",
      };
    }
  } catch (error) {
    return { success: false, error: "Erreur lors de la suppression" };
  }
}

export async function reorderPhoto(
  filename: string,
  prevFilename: string | null,
  nextFilename: string | null,
): Promise<ApiResponse<void>> {
  try {
    const response = await fetch("/api/reorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({
        filename,
        prevFilename,
        nextFilename,
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        error: err.error || "Erreur lors du réordonnancement",
      };
    }
  } catch (error) {
    return { success: false, error: "Erreur lors du réordonnancement" };
  }
}

<script lang="ts">
  import Sortable from "sortablejs";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { auth } from "$lib/stores/auth";
  import type { GalleryImage } from "$lib/types/gallery";
  import {
    LogOut,
    Camera,
    Folder,
    Upload,
    Trash2,
    Lightbulb,
    Tag,
    X,
    Plus,
  } from "lucide-svelte";

  let images: GalleryImage[] = [];
  let allTags: { id: number; name: string }[] = [];
  let selectedPhoto: GalleryImage | null = null;
  let selectedPhotoTags: { id: number; name: string }[] = [];
  let newTagName = "";
  let isCreatingTag = false;
  let tagError = "";

  let uploadError = "";
  let uploadSuccess = "";
  let fileInput: HTMLInputElement;
  let galleryElement: HTMLElement;
  let selectedCount = 0;
  let isAuthenticated = false;
  let isChecking = true;
  let isUploading = false;
  let uploadProgress = 0;
  let currentFile = 0;
  let totalFiles = 0;

  async function checkAuth() {
    if (!browser) return;

    const authenticated = await auth.checkToken();
    if (!authenticated) {
      goto("/login");
    } else {
      isAuthenticated = true;
      isChecking = false;
    }
  }

  async function loadPhotos() {
    const response = await fetch("/gallery.json");
    const data = await response.json();
    images = data.sort((a: GalleryImage, b: GalleryImage) =>
      a.lexoRank.localeCompare(b.lexoRank),
    );
  }

  async function loadTags() {
    try {
      const response = await fetch("/api/tags");
      const data = await response.json();
      allTags = data.tags || [];
    } catch (error) {
      console.error("Erreur lors du chargement des tags:", error);
    }
  }

  async function openPhotoPanel(photo: GalleryImage) {
    selectedPhoto = photo;
    tagError = "";
    await loadPhotoTags();
  }

  function closePhotoPanel() {
    selectedPhoto = null;
    selectedPhotoTags = [];
    newTagName = "";
    tagError = "";
  }

  async function loadPhotoTags() {
    if (!selectedPhoto) return;

    const filename = selectedPhoto.src.split("/").pop();
    try {
      const response = await fetch(`/api/photos/${filename}/tags`);
      const data = await response.json();
      selectedPhotoTags = data.tags || [];
    } catch (error) {
      console.error("Erreur lors du chargement des tags de la photo:", error);
    }
  }

  async function createTag() {
    if (!newTagName.trim()) return;

    isCreatingTag = true;
    tagError = "";
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (response.ok) {
        newTagName = "";
        await loadTags();
      } else {
        const err = await response.json();
        tagError = err.error || "Erreur lors de la création du tag";
      }
    } catch (error) {
      tagError = "Erreur lors de la création du tag";
    } finally {
      isCreatingTag = false;
    }
  }

  async function addTagToPhoto(tagId: number) {
    if (!selectedPhoto) return;

    const filename = selectedPhoto.src.split("/").pop();
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`/api/photos/${filename}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ tagId }),
      });

      if (response.ok) {
        await loadPhotoTags();
      } else {
        const err = await response.json();
        alert(err.error || "Erreur lors de l'ajout du tag");
      }
    } catch (error) {
      alert("Erreur lors de l'ajout du tag");
    }
  }

  async function removeTagFromPhoto(tagId: number) {
    if (!selectedPhoto) return;

    const filename = selectedPhoto.src.split("/").pop();
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `/api/photos/${filename}/tags?tagId=${tagId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );

      if (response.ok) {
        await loadPhotoTags();
      } else {
        const err = await response.json();
        alert(err.error || "Erreur lors du retrait du tag");
      }
    } catch (error) {
      alert("Erreur lors du retrait du tag");
    }
  }

  async function handleUpload(event: { preventDefault: () => void }) {
    event.preventDefault();
    uploadError = "";
    uploadSuccess = "";

    const files = fileInput.files;
    if (!files || !files.length) return;

    isUploading = true;
    totalFiles = files.length;
    currentFile = 0;
    uploadProgress = 0;

    const token = localStorage.getItem("token");
    let failedCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("photo", file);

        try {
          const res = await fetch("/upload", {
            method: "POST",
            headers: {
              Authorization: "Bearer " + token,
            },
            body: formData,
          });

          if (!res.ok) {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
        }

        currentFile = i + 1;
        uploadProgress = Math.round((currentFile / totalFiles) * 100);
      }

      if (failedCount === 0) {
        uploadSuccess = `${totalFiles} photo${totalFiles > 1 ? "s" : ""} uploadée${totalFiles > 1 ? "s" : ""} avec succès !`;
        fileInput.value = "";
        selectedCount = 0;
        await loadPhotos();
      } else if (failedCount === totalFiles) {
        uploadError = "Erreur lors de l'upload de toutes les photos";
      } else {
        uploadSuccess = `${totalFiles - failedCount} photo${totalFiles - failedCount > 1 ? "s" : ""} uploadée${totalFiles - failedCount > 1 ? "s" : ""} avec succès !`;
        uploadError = `${failedCount} photo${failedCount > 1 ? "s" : ""} n'a${failedCount > 1 ? "nt" : ""} pas pu être uploadée`;
        await loadPhotos();
      }
    } catch (error) {
      uploadError = "Erreur lors de l'upload";
    } finally {
      isUploading = false;
      uploadProgress = 0;
      currentFile = 0;
      totalFiles = 0;
    }
  }

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    selectedCount = target.files?.length ?? 0;
  }

  async function deletePhoto(filename: string | undefined) {
    if (!confirm("Voulez-vous vraiment supprimer cette photo ?")) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/photo/" + filename, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (res.ok) {
        images = images.filter((p) => p.src.split("/").pop() !== filename);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  }

  function logout() {
    auth.logout();
    goto("/login");
  }

  onMount(async () => {
    await checkAuth();
    if (isAuthenticated) {
      await loadPhotos();
      await loadTags();

      // Initialize Sortable after photos are loaded
      if (galleryElement) {
        new Sortable(galleryElement, {
          animation: 300,
          easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
          ghostClass: "sortable-ghost",
          dragClass: "sortable-drag",
          onEnd: async function (evt) {
            if (
              typeof evt.oldIndex !== "number" ||
              typeof evt.newIndex !== "number"
            ) {
              return;
            }
            const movedIndex = evt.newIndex;
            const movedPhoto = images[evt.oldIndex];
            if (!movedPhoto) {
              return;
            }
            const movedFilename = movedPhoto.src.split("/").pop();

            // Update local array
            const reordered = [...images];
            const [removed] = reordered.splice(evt.oldIndex, 1);
            reordered.splice(evt.newIndex, 0, removed);
            images = reordered;

            const prevPhoto = reordered[movedIndex - 1];
            const nextPhoto = reordered[movedIndex + 1];
            const prevFilename = prevPhoto
              ? prevPhoto.src.split("/").pop()
              : null;
            const nextFilename = nextPhoto
              ? nextPhoto.src.split("/").pop()
              : null;

            const token = localStorage.getItem("token");
            try {
              const res = await fetch("/api/reorder", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer " + token,
                },
                body: JSON.stringify({
                  filename: movedFilename,
                  prevFilename,
                  nextFilename,
                }),
              });

              if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.error || "Erreur lors du réordonnancement");
                await loadPhotos();
              }
            } catch (error) {
              alert("Erreur lors du réordonnancement");
              await loadPhotos();
            }
          },
        });
      }
    }
  });
</script>

<svelte:head>
  <title>Admin - Galerie Photo</title>
</svelte:head>

{#if isChecking}
  <div class="loading">Vérification...</div>
{:else if isAuthenticated}
  <div class="container">
    <header class="header">
      <h1><Camera size={32} class="icon" /> Administration de la Galerie</h1>
      <button class="logout-btn" on:click={logout}>
        <LogOut size={20} /> Déconnexion
      </button>
    </header>

    <section class="upload-section">
      <h2>Ajouter des photos</h2>
      <form on:submit={handleUpload} class="upload-form">
        <div class="file-input-wrapper">
          <input
            type="file"
            bind:this={fileInput}
            accept="image/*"
            multiple
            class="file-input"
            id="photo"
            on:change={handleFileChange}
          />
          <label for="photo" class="file-label">
            <Folder size={20} />
            <span class="file-text">
              {selectedCount
                ? `${selectedCount} image${selectedCount > 1 ? "s" : ""} sélectionnée${selectedCount > 1 ? "s" : ""}`
                : "Choisir des images"}
            </span>
          </label>
        </div>
        <button type="submit" class="submit-btn" disabled={isUploading}>
          <Upload size={20} />
          {isUploading ? "Envoi en cours..." : "Envoyer"}
        </button>
      </form>
      {#if isUploading}
        <div class="upload-progress">
          <div class="progress-info">
            {currentFile} / {totalFiles}
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: {uploadProgress}%"></div>
          </div>
          <div class="progress-percentage">{uploadProgress}%</div>
        </div>
      {/if}
      {#if uploadError}
        <div class="message error-message">{uploadError}</div>
      {/if}
      {#if uploadSuccess}
        <div class="message success-message">{uploadSuccess}</div>
      {/if}
    </section>

    <section class="gallery-section">
      <h2>Gestion de la galerie</h2>
      <p class="hint">
        <Lightbulb /> Glissez-déposez les photos pour réorganiser l'ordre
      </p>
      <div bind:this={galleryElement} class="gallery-grid">
        {#each images as photo (photo.src)}
          {@const filename = photo.src.split("/").pop()}
          <div class="photo-item" data-filename={filename}>
            <button class="photo-button" on:click={() => openPhotoPanel(photo)}>
              <img src={photo.thumb} alt="" />
            </button>
            <button
              class="delete-button"
              on:click={() => deletePhoto(filename)}
            >
              <Trash2 size={20} />
            </button>
          </div>
        {/each}
      </div>
    </section>
  </div>

  <!-- Panneau latéral pour gérer les tags -->
  {#if selectedPhoto}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="side-panel-overlay" on:click={closePhotoPanel}></div>
    <div class="side-panel">
      <div class="side-panel-header">
        <h3>Gestion de la photo</h3>
        <button class="close-btn" on:click={closePhotoPanel}>
          <X size={24} />
        </button>
      </div>

      <div class="side-panel-content">
        <div class="photo-preview">
          <img src={selectedPhoto.thumb} alt="" />
        </div>

        <div class="tags-section">
          <h4><Tag size={18} /> Tags de cette photo</h4>
          <div class="photo-tags">
            {#if selectedPhotoTags.length === 0}
              <p class="no-tags">Aucun tag pour cette photo</p>
            {:else}
              {#each selectedPhotoTags as tag (tag.id)}
                <div class="tag-chip">
                  <span>{tag.name}</span>
                  <button
                    class="remove-tag-btn"
                    on:click={() => removeTagFromPhoto(tag.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              {/each}
            {/if}
          </div>
        </div>

        <div class="add-tag-section">
          <h4>Ajouter un tag existant</h4>
          <div class="available-tags">
            {#each allTags.filter((t) => !selectedPhotoTags.some((pt) => pt.id === t.id)) as tag (tag.id)}
              <button class="tag-button" on:click={() => addTagToPhoto(tag.id)}>
                <Plus size={14} />
                {tag.name}
              </button>
            {:else}
              <p class="no-tags">Tous les tags sont déjà appliqués</p>
            {/each}
          </div>
        </div>

        <div class="create-tag-section">
          <h4>Créer un nouveau tag</h4>
          <form on:submit|preventDefault={createTag} class="create-tag-form">
            <input
              type="text"
              bind:value={newTagName}
              placeholder="Nom du tag"
              class="tag-input"
            />
            <button
              type="submit"
              class="create-tag-btn"
              disabled={isCreatingTag || !newTagName.trim()}
            >
              <Plus size={16} />
              Créer
            </button>
          </form>
          {#if tagError}
            <div class="tag-error">{tagError}</div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  @import "@catppuccin/palette/css/catppuccin.css";
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-size: 1.5rem;
    color: var(--ctp-mocha-subtext0);
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, sans-serif;
    background-color: var(--ctp-mocha-base);
    color: var(--ctp-mocha-text);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    color: var(--ctp-mocha-text);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: var(--ctp-mocha-surface0);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--ctp-mocha-surface1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .header h1 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--ctp-mocha-text);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  :global(.header h1 .icon) {
    color: var(--ctp-mocha-lavender);
  }

  .logout-btn {
    background-color: var(--ctp-mocha-red);
    color: var(--ctp-mocha-crust);
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  :global(.logout-btn svg) {
    color: var(--ctp-mocha-crust);
  }

  .logout-btn:hover {
    background-color: var(--ctp-mocha-maroon);
  }

  .upload-section,
  .gallery-section {
    background: var(--ctp-mocha-surface0);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--ctp-mocha-surface1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    margin-bottom: 2rem;
  }

  .upload-section h2,
  .gallery-section h2 {
    margin-top: 0;
    color: var(--ctp-mocha-text);
  }

  .upload-form {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .file-input-wrapper {
    flex: 1;
  }

  .file-input {
    display: none;
  }

  .file-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: var(--ctp-mocha-surface1);
    border: 2px dashed var(--ctp-mocha-overlay1);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .file-label:hover {
    background-color: var(--ctp-mocha-surface2);
    border-color: var(--ctp-mocha-overlay0);
  }

  :global(.file-label svg) {
    color: var(--ctp-mocha-text);
  }

  .submit-btn {
    background-color: var(--ctp-mocha-green);
    color: var(--ctp-mocha-crust);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: 600;
  }

  .submit-btn:hover {
    background-color: var(--ctp-mocha-teal);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  :global(.submit-btn svg) {
    color: var(--ctp-mocha-crust);
  }

  .upload-progress {
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--ctp-mocha-surface1);
    border-radius: 4px;
    border: 1px solid var(--ctp-mocha-overlay0);
  }

  .progress-info {
    text-align: center;
    font-size: 0.875rem;
    color: var(--ctp-mocha-subtext0);
    margin-bottom: 0.5rem;
  }

  .progress-bar-container {
    width: 100%;
    height: 24px;
    background-color: var(--ctp-mocha-surface0);
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid var(--ctp-mocha-overlay0);
  }

  .progress-bar {
    height: 100%;
    background-color: var(--ctp-mocha-lavender);
    transition: width 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ctp-mocha-crust);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .progress-percentage {
    text-align: center;
    font-size: 0.875rem;
    color: var(--ctp-mocha-text);
    margin-top: 0.5rem;
    font-weight: 600;
  }

  .message {
    padding: 0.75rem;
    border-radius: 4px;
    margin-top: 1rem;
    background-color: var(--ctp-mocha-surface1);
    border: 1px solid var(--ctp-mocha-overlay0);
    color: var(--ctp-mocha-text);
  }

  .error-message {
    background-color: color-mix(
      in srgb,
      var(--ctp-mocha-red) 12%,
      var(--ctp-mocha-surface0)
    );
    color: var(--ctp-mocha-red);
    border: 1px solid var(--ctp-mocha-red);
  }

  .success-message {
    background-color: color-mix(
      in srgb,
      var(--ctp-mocha-green) 12%,
      var(--ctp-mocha-surface0)
    );
    color: var(--ctp-mocha-green);
    border: 1px solid var(--ctp-mocha-green);
  }

  .hint {
    color: var(--ctp-mocha-subtext0);
    font-style: italic;
    margin-bottom: 1rem;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }

  .photo-item {
    position: relative;
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: 4px;
    overflow: hidden;
    cursor: move;
    aspect-ratio: 1 / 1;
  }

  .photo-button {
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    display: block;
  }

  .photo-button img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .delete-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background-color: color-mix(
      in srgb,
      var(--ctp-mocha-surface0) 85%,
      transparent
    );
    color: var(--ctp-mocha-text);
    border: none;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s;
    padding: 0;
  }

  .delete-button:hover {
    transform: scale(1.1);
  }

  :global(.delete-button svg) {
    color: var(--ctp-mocha-red);
  }

  :global(.sortable-ghost) {
    opacity: 0.4;
  }

  :global(.sortable-drag) {
    opacity: 0.8;
  }

  /* Panneau latéral */
  .side-panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .side-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 400px;
    max-width: 90vw;
    background-color: var(--ctp-mocha-base);
    border-left: 1px solid var(--ctp-mocha-overlay0);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .side-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--ctp-mocha-overlay0);
  }

  .side-panel-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--ctp-mocha-text);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--ctp-mocha-text);
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .close-btn:hover {
    background-color: var(--ctp-mocha-surface0);
  }

  .side-panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .photo-preview {
    margin-bottom: 1.5rem;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--ctp-mocha-overlay0);
  }

  .photo-preview img {
    width: 100%;
    display: block;
  }

  .tags-section,
  .add-tag-section,
  .create-tag-section {
    margin-bottom: 1.5rem;
  }

  .tags-section h4,
  .add-tag-section h4,
  .create-tag-section h4 {
    margin: 0 0 0.75rem 0;
    font-size: 1rem;
    color: var(--ctp-mocha-text);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .photo-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--ctp-mocha-surface0);
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: 16px;
    font-size: 0.875rem;
    color: var(--ctp-mocha-text);
  }

  .remove-tag-btn {
    background: none;
    border: none;
    color: var(--ctp-mocha-red);
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .remove-tag-btn:hover {
    background-color: color-mix(in srgb, var(--ctp-mocha-red) 20%, transparent);
  }

  .no-tags {
    color: var(--ctp-mocha-subtext0);
    font-style: italic;
    margin: 0;
  }

  .available-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .tag-button {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    background-color: var(--ctp-mocha-surface0);
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: 16px;
    font-size: 0.875rem;
    color: var(--ctp-mocha-text);
    cursor: pointer;
    transition: all 0.2s;
  }

  .tag-button:hover {
    background-color: var(--ctp-mocha-surface1);
    border-color: var(--ctp-mocha-blue);
  }

  .create-tag-form {
    display: flex;
    gap: 0.5rem;
  }

  .tag-input {
    flex: 1;
    padding: 0.5rem;
    background-color: var(--ctp-mocha-surface0);
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: 4px;
    color: var(--ctp-mocha-text);
    font-size: 0.875rem;
  }

  .tag-input:focus {
    outline: none;
    border-color: var(--ctp-mocha-blue);
  }

  .create-tag-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    background-color: var(--ctp-mocha-blue);
    color: var(--ctp-mocha-base);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .create-tag-btn:hover:not(:disabled) {
    background-color: var(--ctp-mocha-sapphire);
  }

  .create-tag-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tag-error {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: color-mix(
      in srgb,
      var(--ctp-mocha-red) 12%,
      var(--ctp-mocha-surface0)
    );
    color: var(--ctp-mocha-red);
    border: 1px solid var(--ctp-mocha-red);
    border-radius: 4px;
    font-size: 0.875rem;
  }
</style>

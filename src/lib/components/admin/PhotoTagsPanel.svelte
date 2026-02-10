<script lang="ts">
  import { onMount } from "svelte";
  import type { GalleryImage } from "$lib/types/gallery";
  import {
    getAllTags,
    createTag as createTagApi,
    getPhotoTags,
    addTagToPhoto as addTagApi,
    removeTagFromPhoto as removeTagApi,
  } from "$lib/api/admin";
  import { Tag, X, Plus } from "lucide-svelte";

  export let photo: GalleryImage;
  export let onClose: () => void;

  let allTags: { id: number; name: string }[] = [];
  let photoTags: { id: number; name: string }[] = [];
  let newTagName = "";
  let isCreatingTag = false;
  let tagError = "";

  $: filename = photo.src.split("/").pop()!;

  async function loadTags() {
    allTags = await getAllTags();
  }

  async function loadPhotoTags() {
    photoTags = await getPhotoTags(filename);
  }

  async function createTag() {
    if (!newTagName.trim()) return;

    isCreatingTag = true;
    tagError = "";

    const result = await createTagApi(newTagName);
    if (result.success) {
      newTagName = "";
      await loadTags();
    } else {
      tagError = result.error || "Erreur lors de la création du tag";
    }
    isCreatingTag = false;
  }

  async function addTagToPhoto(tagId: number) {
    const result = await addTagApi(filename, tagId);
    if (result.success) {
      await loadPhotoTags();
    } else {
      alert(result.error);
    }
  }

  async function removeTagFromPhoto(tagId: number) {
    const result = await removeTagApi(filename, tagId);
    if (result.success) {
      await loadPhotoTags();
    } else {
      alert(result.error);
    }
  }

  onMount(() => {
    loadTags();
    loadPhotoTags();
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="side-panel-overlay" on:click={onClose}></div>
<div class="side-panel">
  <div class="side-panel-header">
    <h3>Gestion de la photo</h3>
    <button class="close-btn" on:click={onClose}>
      <X size={24} />
    </button>
  </div>

  <div class="side-panel-content">
    <div class="photo-preview">
      <img src={photo.thumb} alt="" />
    </div>

    <div class="tags-section">
      <h4><Tag size={18} /> Tags de cette photo</h4>
      <div class="photo-tags">
        {#if photoTags.length === 0}
          <p class="no-tags">Aucun tag pour cette photo</p>
        {:else}
          {#each photoTags as tag (tag.id)}
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
        {#each allTags.filter((t) => !photoTags.some((pt) => pt.id === t.id)) as tag (tag.id)}
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

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

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

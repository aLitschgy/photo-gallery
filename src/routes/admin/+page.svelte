<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { GalleryImage } from "$lib/types/gallery";
  import { LogOut, Camera } from "lucide-svelte";
  import "$lib/styles/admin-design-tokens.css";

  import UploadSection from "$lib/components/admin/UploadSection.svelte";
  import GalleryGrid from "$lib/components/admin/GalleryGrid.svelte";
  import PhotoTagsPanel from "$lib/components/admin/PhotoTagsPanel.svelte";
  import TagsManager from "$lib/components/admin/TagsManager.svelte";

  export let data: any;

  type TagsSelectionState = {
    selectedTagIds: number[];
  };

  let images: GalleryImage[] = data.images || [];
  let selectedPhoto: GalleryImage | null = null;
  let tagsRefreshKey = 0;
  let tagsSelectionState: TagsSelectionState = { selectedTagIds: [] };

  async function loadPhotos() {
    await invalidateAll();
  }

  $: images = data.images || [];

  function handlePhotoClick(event: CustomEvent<GalleryImage>) {
    selectedPhoto = event.detail;
  }

  function handlePanelClose() {
    selectedPhoto = null;
  }

  function handleTagsUpdated() {
    tagsRefreshKey += 1;
  }

  function handleSelectedTagsChanged(event: CustomEvent<number[]>) {
    tagsSelectionState = { selectedTagIds: event.detail };
  }
</script>

<svelte:head>
  <title>Admin - Galerie Photo</title>
</svelte:head>

<div class="container">
  <header class="header">
    <h1><Camera size={32} class="icon" /> Administration de la Galerie</h1>
    <form method="POST" action="?/logout">
      <button class="logout-btn" type="submit">
        <LogOut size={20} /> Deconnexion
      </button>
    </form>
  </header>

  <UploadSection on:uploadComplete={loadPhotos} />

  <TagsManager
    {tagsSelectionState}
    on:tagsUpdated={handleTagsUpdated}
    on:selectedTagsChanged={handleSelectedTagsChanged}
  />

  <GalleryGrid
    {images}
    {tagsRefreshKey}
    {tagsSelectionState}
    on:photoClick={handlePhotoClick}
    on:photosChanged={loadPhotos}
  />
</div>

{#if selectedPhoto}
  <PhotoTagsPanel
    photo={selectedPhoto}
    onClose={handlePanelClose}
    on:photoUpdated={loadPhotos}
  />
{/if}

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: var(--admin-font-family);
    background-color: var(--ctp-mocha-base);
    color: var(--ctp-mocha-text);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--admin-space-2xl);
    color: var(--ctp-mocha-text);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--admin-space-2xl);
    background: var(--ctp-mocha-surface0);
    padding: var(--admin-card-padding);
    border-radius: var(--admin-card-radius);
    border: 1px solid var(--ctp-mocha-surface1);
    box-shadow: var(--admin-card-shadow);
  }

  .header h1 {
    margin: 0;
    font-size: var(--admin-text-xl);
    color: var(--ctp-mocha-text);
    display: flex;
    align-items: center;
    gap: var(--admin-gap-md);
  }

  :global(.header h1 .icon) {
    color: var(--ctp-mocha-lavender);
  }

  .logout-btn {
    background-color: var(--ctp-mocha-red);
    color: var(--ctp-mocha-crust);
    border: none;
    padding: var(--admin-btn-padding-md);
    border-radius: var(--admin-btn-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: var(--admin-gap-sm);
    font-size: var(--admin-text-md);
    font-weight: 600;
  }

  :global(.logout-btn svg) {
    color: var(--ctp-mocha-crust);
  }

  .logout-btn:hover {
    background-color: var(--ctp-mocha-maroon);
  }
</style>

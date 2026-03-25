<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import Sortable from "sortablejs";
  import type { GalleryImage } from "$lib/types/gallery";
  import {
    deletePhoto as deletePhotoApi,
    reorderPhoto,
    getAllTags,
    addTagToPhotosBulk,
    setPhotosHiddenBulk,
  } from "$lib/api/admin";
  import { Trash2, Lightbulb, X, EyeOff } from "lucide-svelte";

  export let images: GalleryImage[] = [];
  export let tagsRefreshKey = 0;
  export let tagsSelectionState: { selectedTagIds: number[] } = {
    selectedTagIds: [],
  };

  const dispatch = createEventDispatcher<{
    photoClick: GalleryImage;
    photosChanged: void;
  }>();

  let galleryElement: HTMLElement;
  let sortableInstance: Sortable | null = null;
  let selectedFilenames = new Set<string>();
  let availableTags: { id: number; name: string }[] = [];
  let selectedTagId = "";
  let isApplyingBulk = false;
  let isSelectionMode = false;
  let isDragging = false;
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let suppressNextPhotoClick = false;
  let pressStartX: number | null = null;
  let pressStartY: number | null = null;
  let lastSelectionIndex: number | null = null;
  let lastTagsRefreshKey = tagsRefreshKey;
  let filteredImages: GalleryImage[] = [];

  const LONG_PRESS_MS = 500;
  const MOVE_THRESHOLD_PX = 16;

  $: selectedCount = selectedFilenames.size;
  $: selectedTagIds = tagsSelectionState?.selectedTagIds ?? [];
  $: hasActiveTagFilter = selectedTagIds.length > 0;
  $: filteredImages =
    selectedTagIds.length === 0
      ? images
      : images.filter((photo) =>
          photo.tags?.some((tag) => selectedTagIds.includes(tag.id)),
        );
  $: if (!isSelectionMode) {
    clearSelection();
  }
  $: if (sortableInstance) {
    sortableInstance.option("disabled", isSelectionMode || hasActiveTagFilter);
  }
  $: {
    const imageFilenames = new Set(
      filteredImages.map((p) => p.src.split("/").pop()!),
    );
    const next = new Set(
      Array.from(selectedFilenames).filter((filename) =>
        imageFilenames.has(filename),
      ),
    );
    if (next.size !== selectedFilenames.size) {
      selectedFilenames = next;
    }
  }
  $: if (tagsRefreshKey !== lastTagsRefreshKey) {
    lastTagsRefreshKey = tagsRefreshKey;
    loadAvailableTags();
  }

  async function loadAvailableTags() {
    availableTags = await getAllTags();
  }

  function toggleSelection(filename: string, checked: boolean) {
    const next = new Set(selectedFilenames);
    if (checked) {
      next.add(filename);
    } else {
      next.delete(filename);
    }
    selectedFilenames = next;
  }

  function clearSelection() {
    selectedFilenames = new Set();
    lastSelectionIndex = null;
  }

  function enterSelectionMode(initialFilename?: string, initialIndex?: number) {
    isSelectionMode = true;
    if (initialFilename) {
      const next = new Set(selectedFilenames);
      next.add(initialFilename);
      selectedFilenames = next;
    }
    if (typeof initialIndex === "number") {
      lastSelectionIndex = initialIndex;
    }
  }

  function exitSelectionMode() {
    isSelectionMode = false;
    selectedTagId = "";
    lastSelectionIndex = null;
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && isSelectionMode) {
      exitSelectionMode();
    }
  }

  function selectAllPhotos() {
    selectedFilenames = new Set(
      filteredImages.map((p) => p.src.split("/").pop()!),
    );
  }

  function getPointerPosition(event: MouseEvent | TouchEvent): {
    x: number;
    y: number;
  } {
    if ("touches" in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      return {
        x: touch?.clientX ?? 0,
        y: touch?.clientY ?? 0,
      };
    }

    return { x: event.clientX, y: event.clientY };
  }

  function startLongPress(
    filename: string,
    index: number,
    event: MouseEvent | TouchEvent,
  ) {
    if (isSelectionMode || isDragging) return;

    clearLongPress();
    const point = getPointerPosition(event);
    pressStartX = point.x;
    pressStartY = point.y;

    longPressTimer = setTimeout(() => {
      if (isDragging) {
        clearLongPress();
        return;
      }
      enterSelectionMode(filename, index);
      suppressNextPhotoClick = true;
      clearLongPress();
    }, LONG_PRESS_MS);
  }

  function handlePressMove(event: MouseEvent | TouchEvent) {
    if (!longPressTimer || pressStartX === null || pressStartY === null) return;

    const point = getPointerPosition(event);
    const deltaX = point.x - pressStartX;
    const deltaY = point.y - pressStartY;
    const movedDistance = Math.hypot(deltaX, deltaY);

    if (movedDistance > MOVE_THRESHOLD_PX) {
      clearLongPress();
    }
  }

  function clearLongPress() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    pressStartX = null;
    pressStartY = null;
  }

  function isPhotoHidden(photo: GalleryImage): boolean {
    return photo.tags?.some((tag) => tag.name === "_hidden") ?? false;
  }

  function updateRangeSelection(
    startIndex: number,
    endIndex: number,
    shouldSelect: boolean,
  ) {
    const [from, to] =
      startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    const next = new Set(selectedFilenames);
    for (let i = from; i <= to; i += 1) {
      const filename = filteredImages[i]?.src.split("/").pop();
      if (!filename) continue;

      if (shouldSelect) {
        next.add(filename);
      } else {
        next.delete(filename);
      }
    }

    selectedFilenames = next;
  }

  function handleSelectionToggle(
    filename: string,
    index: number,
    shiftKey: boolean,
    nextChecked?: boolean,
  ) {
    const shouldSelect = nextChecked ?? !selectedFilenames.has(filename);

    if (shiftKey && lastSelectionIndex !== null) {
      updateRangeSelection(lastSelectionIndex, index, shouldSelect);
    } else {
      toggleSelection(filename, shouldSelect);
    }

    lastSelectionIndex = index;
  }

  function handleCheckboxChange(filename: string, index: number, event: Event) {
    const target = event.currentTarget as HTMLInputElement | null;
    if (!target || !filename) return;

    handleSelectionToggle(
      filename,
      index,
      (event as MouseEvent).shiftKey,
      target.checked,
    );
  }

  function handlePhotoClick(
    photo: GalleryImage,
    filename: string,
    index: number,
    event: MouseEvent,
  ) {
    if (suppressNextPhotoClick) {
      suppressNextPhotoClick = false;
      return;
    }

    if (isSelectionMode) {
      handleSelectionToggle(filename, index, event.shiftKey);
      return;
    }

    dispatch("photoClick", photo);
  }

  async function applyBulkAddTag() {
    if (selectedFilenames.size === 0 || !selectedTagId) return;

    isApplyingBulk = true;
    const filenames = Array.from(selectedFilenames);
    const result = await addTagToPhotosBulk(filenames, Number(selectedTagId));
    isApplyingBulk = false;

    if (!result.success) {
      alert(result.error);
      return;
    }
    dispatch("photosChanged");
  }

  async function applyBulkHidden(hidden: boolean) {
    if (selectedFilenames.size === 0) return;

    isApplyingBulk = true;
    const filenames = Array.from(selectedFilenames);
    const result = await setPhotosHiddenBulk(filenames, hidden);
    isApplyingBulk = false;

    if (!result.success) {
      alert(result.error);
      return;
    }
    dispatch("photosChanged");
  }

  async function deletePhoto(filename: string | undefined) {
    if (!confirm("Voulez-vous vraiment supprimer cette photo ?")) return;

    const result = await deletePhotoApi(filename!);
    if (result.success) {
      images = images.filter((p) => p.src.split("/").pop() !== filename);
      dispatch("photosChanged");
    } else {
      alert(result.error);
    }
  }

  onMount(() => {
    window.addEventListener("keydown", handleGlobalKeydown);

    loadAvailableTags();

    if (galleryElement) {
      sortableInstance = new Sortable(galleryElement, {
        animation: 300,
        easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
        ghostClass: "sortable-ghost",
        dragClass: "sortable-drag",
        onStart: function () {
          isDragging = true;
          clearLongPress();
        },
        onEnd: async function (evt) {
          isDragging = false;
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
          const movedFilename = movedPhoto.src.split("/").pop()!;

          // Update local array
          const reordered = [...images];
          const [removed] = reordered.splice(evt.oldIndex, 1);
          reordered.splice(evt.newIndex, 0, removed);
          images = reordered;

          const prevPhoto = reordered[movedIndex - 1];
          const nextPhoto = reordered[movedIndex + 1];
          const prevFilename = prevPhoto
            ? prevPhoto.src.split("/").pop()!
            : null;
          const nextFilename = nextPhoto
            ? nextPhoto.src.split("/").pop()!
            : null;

          const result = await reorderPhoto(
            movedFilename,
            prevFilename,
            nextFilename,
          );
          if (!result.success) {
            alert(result.error);
            dispatch("photosChanged");
          }
        },
      });
    }

    return () => {
      window.removeEventListener("keydown", handleGlobalKeydown);
      clearLongPress();
      sortableInstance?.destroy();
      sortableInstance = null;
    };
  });
</script>

<section class="gallery-section">
  <h2>Gestion de la galerie</h2>
  <p class="hint">
    <Lightbulb />
    {#if isSelectionMode}
      Mode sélection actif
    {:else}
      Glissez-déposez les photos pour réorganiser l'ordre ou appuyez longuement
      pour activer la sélection multiple
    {/if}
  </p>

  {#if isSelectionMode}
    <div class="bulk-actions">
      <div class="bulk-header">
        <div class="bulk-label">{selectedCount} photo(s) sélectionnée(s)</div>
        <button class="close-selection-btn" on:click={exitSelectionMode}>
          <X size={16} />
        </button>
      </div>

      <div class="bulk-controls">
        <button
          class="bulk-btn"
          on:click={selectAllPhotos}
          disabled={isApplyingBulk || images.length === 0}
        >
          Tout sélectionner
        </button>
        <select bind:value={selectedTagId} disabled={isApplyingBulk}>
          <option value="">Ajouter un tag…</option>
          {#each availableTags as tag (tag.id)}
            <option value={String(tag.id)}>{tag.name}</option>
          {/each}
        </select>
        <button
          class="bulk-btn"
          on:click={applyBulkAddTag}
          disabled={isApplyingBulk || selectedCount === 0 || !selectedTagId}
        >
          Ajouter le tag
        </button>
        <button
          class="bulk-btn"
          on:click={() => applyBulkHidden(true)}
          disabled={isApplyingBulk || selectedCount === 0}
        >
          Cacher
        </button>
        <button
          class="bulk-btn"
          on:click={() => applyBulkHidden(false)}
          disabled={isApplyingBulk || selectedCount === 0}
        >
          Afficher
        </button>
        <button
          class="bulk-btn secondary"
          on:click={clearSelection}
          disabled={isApplyingBulk || selectedCount === 0}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  {/if}

  <div bind:this={galleryElement} class="gallery-grid">
    {#each filteredImages as photo, index (photo.src)}
      {@const filename = photo.src.split("/").pop()}
      <div
        class="photo-item"
        class:selection-mode={isSelectionMode}
        data-filename={filename}
      >
        {#if isSelectionMode}
          <label class="select-checkbox">
            <input
              type="checkbox"
              checked={selectedFilenames.has(filename || "")}
              on:click|stopPropagation
              on:change={(e) => handleCheckboxChange(filename || "", index, e)}
            />
          </label>
        {/if}
        <button
          class="photo-button"
          on:contextmenu|preventDefault
          on:mousedown={(event) => startLongPress(filename || "", index, event)}
          on:mousemove={handlePressMove}
          on:mouseup={clearLongPress}
          on:mouseleave={clearLongPress}
          on:touchstart={(event) =>
            startLongPress(filename || "", index, event)}
          on:touchmove={handlePressMove}
          on:touchend={clearLongPress}
          on:touchcancel={clearLongPress}
          on:click={(event) =>
            handlePhotoClick(photo, filename || "", index, event)}
        >
          <img
            src={photo.thumb}
            alt=""
            draggable="false"
            class={isPhotoHidden(photo) ? "hidden" : ""}
          />
        </button>
        {#if isPhotoHidden(photo)}
          <div
            class="hidden-overlay"
            aria-label="Photo masquée"
            title="Photo masquée"
          >
            <EyeOff size={34} />
          </div>
        {/if}
        <button class="delete-button" on:click={() => deletePhoto(filename)}>
          <Trash2 size={20} />
        </button>
      </div>
    {/each}
  </div>
</section>

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

  .gallery-section {
    background: var(--ctp-mocha-surface0);
    padding: var(--admin-card-padding);
    border-radius: var(--admin-card-radius);
    border: 1px solid var(--ctp-mocha-surface1);
    box-shadow: var(--admin-card-shadow);
    margin-bottom: var(--admin-card-margin-bottom);
  }

  .gallery-section h2 {
    margin-top: 0;
    color: var(--ctp-mocha-text);
  }

  .hint {
    color: var(--ctp-mocha-subtext0);
    font-style: italic;
    margin-bottom: var(--admin-space-lg);
    display: flex;
    align-items: center;
    gap: var(--admin-gap-sm);
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(var(--admin-photo-grid-min), 1fr)
    );
    gap: var(--admin-photo-grid-gap);
  }

  .bulk-actions {
    margin-bottom: var(--admin-space-lg);
    padding: var(--admin-space-md);
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: var(--admin-radius-md);
    background: var(--ctp-mocha-surface1);
  }

  .bulk-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--admin-space-sm);
  }

  .bulk-label {
    font-size: var(--admin-text-sm);
    color: var(--ctp-mocha-subtext0);
  }

  .close-selection-btn {
    width: 28px;
    height: 28px;
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: var(--admin-radius-md);
    background: var(--ctp-mocha-surface0);
    color: var(--ctp-mocha-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .bulk-controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--admin-gap-sm);
    align-items: center;
  }

  .bulk-controls select {
    background: var(--ctp-mocha-base);
    color: var(--ctp-mocha-text);
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: var(--admin-radius-sm);
    padding: var(--admin-btn-padding-sm);
    font-size: var(--admin-text-sm);
  }

  .bulk-btn {
    border: 1px solid var(--ctp-mocha-overlay0);
    background: var(--ctp-mocha-surface0);
    color: var(--ctp-mocha-text);
    border-radius: var(--admin-radius-sm);
    padding: var(--admin-btn-padding-sm);
    font-size: var(--admin-text-sm);
    cursor: pointer;
  }

  .bulk-btn.secondary {
    color: var(--ctp-mocha-subtext0);
  }

  .bulk-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .photo-item {
    position: relative;
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: var(--admin-radius-sm);
    overflow: hidden;
    cursor: move;
    aspect-ratio: 1 / 1;
  }

  .photo-item.selection-mode {
    cursor: pointer;
  }

  .select-checkbox {
    position: absolute;
    top: var(--admin-photo-select-offset);
    left: var(--admin-photo-select-offset);
    z-index: 2;
    background: color-mix(in srgb, var(--ctp-mocha-surface0) 85%, transparent);
    border-radius: var(--admin-radius-sm);
    padding: 0.15rem var(--admin-space-xs);
  }

  .select-checkbox input {
    cursor: pointer;
  }

  .photo-button {
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    display: block;
    -webkit-touch-callout: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: manipulation;
  }

  .photo-button img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    -webkit-touch-callout: none;
    -webkit-user-drag: none;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
  }

  .photo-button img.hidden {
    opacity: 0.1;
  }

  .hidden-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--ctp-mocha-surface0) 20%, transparent);
    color: var(--ctp-mocha-red);
    pointer-events: none;
  }

  .delete-button {
    position: absolute;
    top: var(--admin-photo-select-offset);
    right: var(--admin-photo-select-offset);
    background-color: color-mix(
      in srgb,
      var(--ctp-mocha-surface0) 85%,
      transparent
    );
    color: var(--ctp-mocha-text);
    border: none;
    border-radius: var(--admin-radius-full);
    width: var(--admin-photo-delete-size);
    height: var(--admin-photo-delete-size);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform var(--admin-transition-normal);
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
</style>

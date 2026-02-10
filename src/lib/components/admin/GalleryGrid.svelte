<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import Sortable from "sortablejs";
  import type { GalleryImage } from "$lib/types/gallery";
  import { deletePhoto as deletePhotoApi, reorderPhoto } from "$lib/api/admin";
  import { Trash2, Lightbulb } from "lucide-svelte";

  export let images: GalleryImage[] = [];

  const dispatch = createEventDispatcher<{
    photoClick: GalleryImage;
    photosChanged: void;
  }>();

  let galleryElement: HTMLElement;

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
  });
</script>

<section class="gallery-section">
  <h2>Gestion de la galerie</h2>
  <p class="hint">
    <Lightbulb /> Glissez-déposez les photos pour réorganiser l'ordre
  </p>
  <div bind:this={galleryElement} class="gallery-grid">
    {#each images as photo (photo.src)}
      {@const filename = photo.src.split("/").pop()}
      <div class="photo-item" data-filename={filename}>
        <button
          class="photo-button"
          on:click={() => dispatch("photoClick", photo)}
        >
          <img src={photo.thumb} alt="" />
        </button>
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
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--ctp-mocha-surface1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    margin-bottom: 2rem;
  }

  .gallery-section h2 {
    margin-top: 0;
    color: var(--ctp-mocha-text);
  }

  .hint {
    color: var(--ctp-mocha-subtext0);
    font-style: italic;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
</style>

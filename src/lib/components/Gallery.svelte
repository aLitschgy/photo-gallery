<script lang="ts">
  import { onMount } from "svelte";
  import justifiedLayout from "justified-layout";
  import PhotoSwipeLightbox from "photoswipe/lightbox";
  import PhotoSwipe from "photoswipe";
  import "photoswipe/style.css";
  import { type GalleryImage } from "$lib/types/gallery";

  export let images: GalleryImage[] = [];

  let galleryContainer: HTMLDivElement;
  let lightbox: PhotoSwipeLightbox | null = null;
  let containerWidth = 0;

  function renderGallery() {
    if (!galleryContainer || images.length === 0) return;

    containerWidth = galleryContainer.clientWidth;
    const aspectRatios = images.map((img) => img.width / img.height);

    const layout = justifiedLayout(aspectRatios, {
      containerWidth,
      targetRowHeight: 300,
      boxSpacing: 10,
    });

    if (layout && typeof layout.containerHeight === "number") {
      galleryContainer.style.height = layout.containerHeight + "px";
    }

    // Clean up previous lightbox
    if (lightbox) {
      lightbox.destroy();
      lightbox = null;
    }

    // Initialize PhotoSwipe
    setTimeout(() => {
      lightbox = new PhotoSwipeLightbox({
        gallery: "#gallery",
        children: ".item",
        pswpModule: PhotoSwipe,
      });
      lightbox.init();
    }, 100);

    return layout;
  }

  let resizeTimeout: NodeJS.Timeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderGallery();
    }, 150);
  }

  onMount(() => {
    renderGallery();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (lightbox) {
        lightbox.destroy();
      }
    };
  });

  // Re-render quand les images changent
  $: if (images && images.length > 0 && galleryContainer) {
    renderGallery();
  }

  $: layout =
    images.length > 0 && containerWidth > 0
      ? (() => {
          const aspectRatios = images.map((img) => img.width / img.height);
          return justifiedLayout(aspectRatios, {
            containerWidth,
            targetRowHeight: 300,
            boxSpacing: 10,
          });
        })()
      : null;
</script>

<div
  id="gallery"
  class="gallery"
  bind:this={galleryContainer}
  bind:clientWidth={containerWidth}
>
  {#if layout}
    {#each images as img, i}
      <a
        href={img.src}
        data-pswp-width={img.width}
        data-pswp-height={img.height}
        class="item"
        style="position: absolute; left: {layout.boxes[i].left}px; top: {layout
          .boxes[i].top}px; width: {layout.boxes[i].width}px; height: {layout
          .boxes[i].height}px;"
      >
        <img
          src={img.thumb || img.src}
          alt=""
          style="width: {layout.boxes[i].width}px; height: {layout.boxes[i]
            .height}px; object-fit: cover;"
        />
      </a>
    {/each}
  {/if}
</div>

<style>
  .gallery {
    position: relative;
    width: 100%;
  }

  .item {
    display: block;
    overflow: hidden;
    cursor: pointer;
  }

  .item img {
    display: block;
    object-fit: cover;
  }
</style>

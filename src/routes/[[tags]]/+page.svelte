<script lang="ts">
  import Gallery from "$lib/components/Gallery.svelte";

  export let data: any;
</script>

<svelte:head>
  <title>Photo Gallery</title>
</svelte:head>

{#if data.images}
  <Gallery images={data.images} />
{/if}

<footer>
  <p>
    &copy; {new Date().getFullYear()} -
    <a href="https://github.com/aLitschgy/photo-gallery">Photo Gallery</a>
    - Antonin Litschgy
  </p>
</footer>

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background-color: #050505;
    color: var(--ctp-mocha-text);
  }

  :global(.gallery) {
    max-width: 1400px;
    margin: 0 auto;
  }

  footer {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--ctp-mocha-subtext0);
    margin-top: 2rem;
  }

  footer p {
    margin: 0;
  }

  footer a {
    color: var(--ctp-mocha-blue);
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }
</style>

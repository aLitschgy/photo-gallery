<script lang="ts">
  import type { LayoutData } from "./$types";

  export let data: LayoutData;
</script>

<svelte:head>
  {#if data.customScript}
    {@html data.customScript}
  {/if}
</svelte:head>

<slot />

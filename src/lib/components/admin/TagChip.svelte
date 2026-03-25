<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { X } from "lucide-svelte";

  export let label: string;
  export let removable = false;
  export let disabled = false;
  export let isSelected = false;
  export let clickable = false;

  const dispatch = createEventDispatcher<{
    remove: void;
    select: void;
  }>();

  function handleRemove() {
    if (disabled) return;
    dispatch("remove");
  }

  function handleSelect() {
    if (disabled || !clickable) return;
    dispatch("select");
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!clickable || disabled) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect();
    }
  }
</script>

{#if clickable}
  <div
    class="tag-chip"
    class:disabled
    class:selected={isSelected}
    class:clickable
    role="button"
    tabindex="0"
    on:click={handleSelect}
    on:keydown={handleKeydown}
  >
    <span>{label}</span>
    {#if removable}
      <button
        type="button"
        class="remove-tag-btn"
        {disabled}
        on:click|stopPropagation={handleRemove}
        aria-label={`Supprimer le tag ${label}`}
        title={`Supprimer ${label}`}
      >
        <X size={14} />
      </button>
    {/if}
  </div>
{:else}
  <div class="tag-chip" class:disabled class:selected={isSelected}>
    <span>{label}</span>
    {#if removable}
      <button
        type="button"
        class="remove-tag-btn"
        on:click|stopPropagation={handleRemove}
        {disabled}
        aria-label={`Supprimer le tag ${label}`}
        title={`Supprimer ${label}`}
      >
        <X size={14} />
      </button>
    {/if}
  </div>
{/if}

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

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
    max-width: 100%;
  }

  .tag-chip.selected {
    background-color: var(--ctp-mocha-blue);
    border-color: var(--ctp-mocha-blue);
    color: var(--ctp-mocha-base);
  }

  .tag-chip.clickable {
    cursor: pointer;
    transition:
      background-color 0.2s,
      border-color 0.2s,
      color 0.2s;
  }

  .tag-chip.clickable:hover {
    background-color: var(--ctp-mocha-surface1);
    border-color: var(--ctp-mocha-blue);
  }

  .tag-chip.clickable.selected:hover {
    background-color: var(--ctp-mocha-sapphire);
    border-color: var(--ctp-mocha-sapphire);
  }

  .tag-chip span {
    overflow-wrap: anywhere;
  }

  .tag-chip.disabled {
    opacity: 0.6;
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

  .tag-chip.selected .remove-tag-btn {
    color: var(--ctp-mocha-base);
  }

  .tag-chip.selected .remove-tag-btn:hover:not(:disabled) {
    background-color: color-mix(
      in srgb,
      var(--ctp-mocha-base) 25%,
      transparent
    );
  }

  .remove-tag-btn:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--ctp-mocha-red) 20%, transparent);
  }

  .remove-tag-btn:disabled {
    cursor: not-allowed;
  }
</style>

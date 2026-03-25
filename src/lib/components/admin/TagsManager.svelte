<script lang="ts">
  import { onMount, createEventDispatcher } from "svelte";
  import { getAllTags, createTag, deleteTag } from "$lib/api/admin";
  import { Plus, Tags } from "lucide-svelte";
  import TagChip from "$lib/components/admin/TagChip.svelte";

  type Tag = { id: number; name: string };
  type TagsSelectionState = { selectedTagIds: number[] };

  export let tagsSelectionState: TagsSelectionState;

  const dispatch = createEventDispatcher<{
    tagsUpdated: void;
    selectedTagsChanged: number[];
  }>();

  let tags: Tag[] = [];
  let newTagName = "";
  let isCreating = false;
  let deletingTagId: number | null = null;
  let errorMessage = "";
  let successMessage = "";

  async function loadTags() {
    tags = await getAllTags();
  }

  function clearMessages() {
    errorMessage = "";
    successMessage = "";
  }

  function setSelectedTagIds(nextSelectedTagIds: number[]) {
    dispatch("selectedTagsChanged", nextSelectedTagIds);
  }

  function toggleSelectedTag(tagId: number) {
    const current = tagsSelectionState?.selectedTagIds || [];
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    setSelectedTagIds(next);
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;

    clearMessages();
    isCreating = true;
    const result = await createTag(newTagName);
    isCreating = false;

    if (!result.success) {
      errorMessage = result.error || "Erreur lors de la création du tag";
      return;
    }

    newTagName = "";
    successMessage = "Tag créé avec succès";
    await loadTags();
    dispatch("tagsUpdated");
  }

  async function handleDeleteTag(tag: Tag) {
    deletingTagId = tag.id;
    const result = await deleteTag(tag.id);
    deletingTagId = null;

    if (!result.success) {
      clearMessages();
      errorMessage = result.error || "Erreur lors de la suppression du tag";
      return;
    }
    clearMessages();
    successMessage = "Tag supprimé avec succès";
    await loadTags();

    const current = tagsSelectionState?.selectedTagIds || [];
    if (current.includes(tag.id)) {
      setSelectedTagIds(current.filter((id) => id !== tag.id));
    }

    dispatch("tagsUpdated");
  }

  onMount(() => {
    loadTags();
  });
</script>

<section class="tags-manager-section">
  <h2><Tags size={20} /> Gestion des tags</h2>

  <form class="create-tag-form" on:submit|preventDefault={handleCreateTag}>
    <input
      type="text"
      bind:value={newTagName}
      placeholder="Nom du tag"
      aria-label="Nom du tag"
    />
    <button type="submit" disabled={isCreating || !newTagName.trim()}>
      <Plus size={16} />
      Créer
    </button>
  </form>

  {#if errorMessage}
    <p class="message error">{errorMessage}</p>
  {/if}

  {#if successMessage}
    <p class="message success">{successMessage}</p>
  {/if}

  <div class="tags-list">
    {#if tags.length === 0}
      <p class="empty">Aucun tag disponible</p>
    {:else}
      {#each tags as tag (tag.id)}
        <TagChip
          label={tag.name}
          removable={true}
          clickable={true}
          isSelected={tagsSelectionState?.selectedTagIds?.includes(tag.id)}
          disabled={deletingTagId === tag.id}
          on:select={() => toggleSelectedTag(tag.id)}
          on:remove={() => handleDeleteTag(tag)}
        />
      {/each}
    {/if}
  </div>
</section>

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

  .tags-manager-section {
    background: var(--ctp-mocha-surface0);
    padding: var(--admin-card-padding);
    border-radius: var(--admin-card-radius);
    border: 1px solid var(--ctp-mocha-surface1);
    box-shadow: var(--admin-card-shadow);
    margin-bottom: var(--admin-card-margin-bottom);
  }

  .tags-manager-section h2 {
    margin: 0 0 var(--admin-space-lg) 0;
    color: var(--ctp-mocha-text);
    display: flex;
    align-items: center;
    gap: var(--admin-gap-sm);
  }

  .create-tag-form {
    display: flex;
    gap: var(--admin-gap-sm);
    flex-wrap: wrap;
    margin-bottom: var(--admin-space-md);
  }

  .create-tag-form input {
    background: var(--ctp-mocha-base);
    color: var(--ctp-mocha-text);
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: var(--admin-input-radius);
    padding: var(--admin-input-padding);
    min-width: 220px;
    font-size: var(--admin-text-sm);
  }

  .create-tag-form button {
    border: 1px solid var(--ctp-mocha-overlay0);
    background: var(--ctp-mocha-surface0);
    color: var(--ctp-mocha-text);
    border-radius: var(--admin-btn-radius);
    padding: var(--admin-btn-padding-sm);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: var(--admin-space-xs);
    font-size: var(--admin-text-sm);
  }

  .create-tag-form button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .message {
    margin: var(--admin-space-xs) 0 var(--admin-space-md) 0;
    font-size: var(--admin-text-sm);
  }

  .message.error {
    color: var(--ctp-mocha-red);
  }

  .message.success {
    color: var(--ctp-mocha-green);
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--admin-gap-sm);
    align-items: center;
  }

  .empty {
    margin: 0;
    color: var(--ctp-mocha-subtext0);
  }
</style>

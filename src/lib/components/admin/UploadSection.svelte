<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { uploadPhoto } from "$lib/api/admin";
  import { Folder, Upload } from "lucide-svelte";

  const dispatch = createEventDispatcher<{
    uploadComplete: void;
  }>();

  let fileInput: HTMLInputElement;
  let selectedCount = 0;
  let isUploading = false;
  let uploadProgress = 0;
  let currentFile = 0;
  let totalFiles = 0;
  let uploadError = "";
  let uploadSuccess = "";

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

    let failedCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const success = await uploadPhoto(file);

        if (!success) {
          failedCount++;
        }

        currentFile = i + 1;
        uploadProgress = Math.round((currentFile / totalFiles) * 100);
      }

      if (failedCount === 0) {
        uploadSuccess = `${totalFiles} photo${totalFiles > 1 ? "s" : ""} uploadée${totalFiles > 1 ? "s" : ""} avec succès !`;
        fileInput.value = "";
        selectedCount = 0;
        dispatch("uploadComplete");
      } else if (failedCount === totalFiles) {
        uploadError = "Erreur lors de l'upload de toutes les photos";
      } else {
        uploadSuccess = `${totalFiles - failedCount} photo${totalFiles - failedCount > 1 ? "s" : ""} uploadée${totalFiles - failedCount > 1 ? "s" : ""} avec succès !`;
        uploadError = `${failedCount} photo${failedCount > 1 ? "s" : ""} n'a${failedCount > 1 ? "nt" : ""} pas pu être uploadée`;
        dispatch("uploadComplete");
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
</script>

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

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

  .upload-section {
    background: var(--ctp-mocha-surface0);
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--ctp-mocha-surface1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    margin-bottom: 2rem;
  }

  .upload-section h2 {
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
</style>

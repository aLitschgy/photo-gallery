<script lang="ts">
  import { goto } from "$app/navigation";
  import { auth } from "$lib/stores/auth";
  import { Lock } from "lucide-svelte";

  let password = "";
  let error = "";
  let loading = false;

  async function handleSubmit(event: { preventDefault: () => void }) {
    event.preventDefault();
    error = "";
    loading = true;

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        const data = await res.json();
        auth.login(data.token);
        goto("/admin");
      } else {
        const err = await res.json();
        error = err.error || "Erreur de connexion";
      }
    } catch (e) {
      error = "Erreur de connexion";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Connexion</title>
</svelte:head>

<div class="login-container">
  <div class="login-box">
    <h2><Lock size={24} class="icon" /> Connexion</h2>
    <form on:submit={handleSubmit}>
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          disabled={loading}
        />
      </div>
      {#if error}
        <div class="error">{error}</div>
      {/if}
      <button type="submit" disabled={loading}>
        {loading ? "Connexion..." : "Entrer"}
      </button>
    </form>
  </div>
</div>

<style>
  @import "@catppuccin/palette/css/catppuccin.css";

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, sans-serif;
    background-color: var(--ctp-mocha-base);
    color: var(--ctp-mocha-text);
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--ctp-mocha-lavender) 0%,
      var(--ctp-mocha-mauve) 100%
    );
  }

  .login-box {
    background: var(--ctp-mocha-surface0);
    color: var(--ctp-mocha-text);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    width: 100%;
    max-width: 400px;
  }

  h2 {
    margin: 0 0 1.5rem 0;
    text-align: center;
    color: var(--ctp-mocha-text);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  :global(.icon) {
    color: var(--ctp-mocha-lavender);
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--ctp-mocha-subtext0);
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--ctp-mocha-overlay0);
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
    background-color: var(--ctp-mocha-base);
    color: var(--ctp-mocha-text);
  }

  input:focus {
    outline: none;
    border-color: var(--ctp-mocha-lavender);
    box-shadow: 0 0 0 3px
      color-mix(in srgb, var(--ctp-mocha-lavender) 30%, transparent);
  }

  input:disabled {
    background-color: var(--ctp-mocha-surface1);
    cursor: not-allowed;
  }

  button {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--ctp-mocha-lavender);
    color: var(--ctp-mocha-crust);
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.3s,
      transform 0.1s ease;
  }

  button:hover:not(:disabled) {
    background-color: var(--ctp-mocha-mauve);
    transform: translateY(-1px);
  }

  button:disabled {
    background-color: var(--ctp-mocha-overlay1);
    color: var(--ctp-mocha-surface2);
    cursor: not-allowed;
  }

  .error {
    color: var(--ctp-mocha-red);
    background-color: var(--ctp-mocha-crust);
    border: 1px solid var(--ctp-mocha-red);
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
</style>

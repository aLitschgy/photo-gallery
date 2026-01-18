import { writable } from "svelte/store";
import { browser } from "$app/environment";

function createAuthStore() {
  const { subscribe, set, update } = writable({
    token: browser ? localStorage.getItem("token") : null,
    isAuthenticated: browser ? !!localStorage.getItem("token") : false,
  });

  return {
    subscribe,
    login: (token) => {
      if (browser) {
        localStorage.setItem("token", token);
      }
      set({ token, isAuthenticated: true });
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem("token");
      }
      set({ token: null, isAuthenticated: false });
    },
    checkToken: async () => {
      if (!browser) return false;

      const token = localStorage.getItem("token");
      if (!token) {
        set({ token: null, isAuthenticated: false });
        return false;
      }

      try {
        const res = await fetch("/api/check-token", {
          headers: { Authorization: "Bearer " + token },
        });

        if (res.status === 200) {
          set({ token, isAuthenticated: true });
          return true;
        } else {
          localStorage.removeItem("token");
          set({ token: null, isAuthenticated: false });
          return false;
        }
      } catch (error) {
        localStorage.removeItem("token");
        set({ token: null, isAuthenticated: false });
        return false;
      }
    },
  };
}

export const auth = createAuthStore();

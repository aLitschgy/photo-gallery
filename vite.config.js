import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __filename: "import.meta.url",
    __dirname: "import.meta.dirname",
  },
});

import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const csrfTrustedOrigins = (process.env.CSRF_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0 && origin !== "*");

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      out: "build",
      precompress: false,
      envPrefix: "",
    }),
    alias: {
      $lib: "src/lib",
    },
    ...(csrfTrustedOrigins.length > 0
      ? {
          csrf: {
            trustedOrigins: csrfTrustedOrigins,
          },
        }
      : {}),
  },
};

export default config;

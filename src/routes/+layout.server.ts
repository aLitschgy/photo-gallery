import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async () => {
  return {
    customScript: process.env.CUSTOM_SCRIPT ?? "",
  };
};

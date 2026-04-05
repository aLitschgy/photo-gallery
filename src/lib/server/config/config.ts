export const PASSWORD = process.env.PASSWORD || "mypassword";
export const SESSION_SECRET = process.env.SESSION_SECRET || "supersecret";
export const AUTH_COOKIE_NAME = "photo_gallery_session";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 2;

function parseOptionalBoolean(value: string | undefined): boolean | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;

  return null;
}

// Optional override for cookie security mode.
// When unset, login route picks secure mode from request protocol/forwarded headers.
export const AUTH_COOKIE_SECURE_OVERRIDE = parseOptionalBoolean(
  process.env.AUTH_COOKIE_SECURE,
);

if (!process.env.SESSION_SECRET) {
  console.warn(
    "Warning: environment variable SESSION_SECRET is not set — falling back to insecure default.",
  );
}
if (!process.env.PASSWORD) {
  console.warn(
    "Warning: environment variable PASSWORD is not set — falling back to insecure default.",
  );
}

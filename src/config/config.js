export const PASSWORD = process.env.PASSWORD || "mypassword";
export const SESSION_SECRET = process.env.SESSION_SECRET || "supersecret";

if (!process.env.SESSION_SECRET) {
  console.warn('Warning: environment variable SESSION_SECRET is not set — falling back to insecure default.');
}
if (!process.env.PASSWORD) {
  console.warn('Warning: environment variable PASSWORD is not set — falling back to insecure default.');
}

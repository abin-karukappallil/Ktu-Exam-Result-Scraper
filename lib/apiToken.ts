import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.API_TOKEN_SECRET || randomBytes(32).toString("hex");
const TOKEN_TTL_MS = 5 * 60 * 1000;

export function generateToken(): { token: string; expiresAt: number } {
  const nonce = randomBytes(8).toString("hex");
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const payload = `${nonce}.${expiresAt}`;
  const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
  return { token: `${payload}.${signature}`, expiresAt };
}

export function verifyToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [nonce, expiresAtStr, signature] = parts;
  const payload = `${nonce}.${expiresAtStr}`;
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  if (signature !== expected) return false;
  const expiresAt = parseInt(expiresAtStr, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) return false;
  return true;
}

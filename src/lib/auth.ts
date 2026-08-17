import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "pmc_admin";

// No fallback value on purpose. A default here would mean a missing or
// misspelled env var silently leaves the admin panel open on a known password.
// Returns null instead, and every caller below fails closed.
function passcode(): string | null {
  const value = process.env.ADMIN_PASSCODE;
  if (!value) {
    console.error(
      "ADMIN_PASSCODE is not set — admin access is disabled until it is configured."
    );
    return null;
  }
  return value;
}

function sha(value: string): Buffer {
  return crypto.createHash("sha256").update(value).digest();
}

// Token stored in the cookie — a hash of the passcode, never the passcode itself.
function expectedToken(): string | null {
  const secret = passcode();
  return secret === null ? null : sha(secret).toString("hex");
}

export function checkPasscode(input: string): boolean {
  const secret = passcode();
  if (secret === null || typeof input !== "string") return false;
  return crypto.timingSafeEqual(sha(input), sha(secret));
}

export async function setAdminCookie(): Promise<void> {
  const token = expectedToken();
  if (token === null) return;
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAdminCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const expected = expectedToken();
  if (expected === null) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (typeof value !== "string" || value.length !== expected.length) return false;
  // Constant-time compare so the cookie can't be probed byte by byte.
  return crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

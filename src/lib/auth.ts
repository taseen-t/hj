import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "pmc_admin";

function passcode(): string {
  return process.env.ADMIN_PASSCODE || "admin123";
}

function sha(value: string): Buffer {
  return crypto.createHash("sha256").update(value).digest();
}

// Token stored in the cookie — a hash of the passcode, never the passcode itself.
function expectedToken(): string {
  return sha(passcode()).toString("hex");
}

export function checkPasscode(input: string): boolean {
  if (typeof input !== "string") return false;
  const a = sha(input);
  const b = sha(passcode());
  return crypto.timingSafeEqual(a, b);
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, expectedToken(), {
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
  const value = (await cookies()).get(COOKIE)?.value;
  return value === expectedToken();
}

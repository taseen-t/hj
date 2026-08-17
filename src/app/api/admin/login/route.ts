import { NextResponse } from "next/server";
import { checkPasscode, setAdminCookie } from "@/lib/auth";
import { clearRateLimit, clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deliberately tight: a real admin needs a handful of tries, an attacker needs
// thousands. Ten per fifteen minutes per address is generous for the former.
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  const key = `admin-login:${clientKey(req)}`;
  const limit = rateLimit(key, { max: MAX_ATTEMPTS, windowMs: WINDOW_MS });

  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = (await req.json().catch(() => ({}))) as { passcode?: string };
  if (!checkPasscode(body.passcode ?? "")) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  clearRateLimit(key);
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { checkPasscode, setAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { passcode?: string };
  if (!checkPasscode(body.passcode ?? "")) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}

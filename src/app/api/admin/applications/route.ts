import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getStore, storeMode } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const applications = await getStore().list();
    return NextResponse.json({ applications, mode: storeMode() });
  } catch (e) {
    console.error("Failed to list applications:", e);
    return NextResponse.json({ error: "Could not load applications" }, { status: 500 });
  }
}

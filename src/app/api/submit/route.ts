import { NextResponse } from "next/server";
import { applicationInputSchema } from "@/lib/types";
import { getStore } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = applicationInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const app = await getStore().create(parsed.data);
    return NextResponse.json({ id: app.id, createdAt: app.createdAt });
  } catch (e) {
    console.error("Failed to save application:", e);
    return NextResponse.json({ error: "Could not save application" }, { status: 500 });
  }
}

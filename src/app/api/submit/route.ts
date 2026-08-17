import { NextResponse } from "next/server";
import { applicationInputSchema, referenceIdFor } from "@/lib/types";
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
    const store = getStore();
    // Reject duplicate CNIC submissions (normalize for comparison).
    const existing = await store.findByCnic(parsed.data.cnic);
    if (existing) {
      // Deliberately does not echo the existing reference ID: this endpoint is
      // public, so returning it would let anyone probe a CNIC and learn both
      // that the person applied and their reference number.
      return NextResponse.json(
        {
          error:
            "An application with this CNIC has already been submitted. " +
            "If this was not you, please contact the office.",
          duplicate: true,
        },
        { status: 409 }
      );
    }
    const app = await store.create(parsed.data);
    return NextResponse.json({
      id: app.id,
      createdAt: app.createdAt,
      referenceId: referenceIdFor(app),
    });
  } catch (e) {
    console.error("Failed to save application:", e);
    return NextResponse.json({ error: "Could not save application" }, { status: 500 });
  }
}

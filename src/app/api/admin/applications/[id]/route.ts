import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getStore } from "@/lib/db";
import { applicationUpdateSchema, type ApplicationPatch } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = applicationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const patch: ApplicationPatch = {};

  // Plain strings — pass through if present.
  const stringKeys = [
    "name",
    "fatherName",
    "placeOfBirth",
    "dateOfBirth",
    "religion",
    "nationality",
    "cnic",
    "districtOfDomicile",
    "whatsapp",
    "guardianMobile",
    "mailingAddress",
    "preference1",
  ] as const;
  for (const k of stringKeys) {
    const v = data[k];
    if (v !== undefined) patch[k] = v;
  }
  // Optional strings — empty string means "clear it".
  const optionalStringKeys = [
    "universityStatus",
    "universityName",
    "preference2",
    "preference3",
    "preference4",
  ] as const;
  for (const k of optionalStringKeys) {
    const v = data[k];
    if (v !== undefined) patch[k] = v || "";
  }
  // Enums.
  if (data.gender !== undefined) patch.gender = data.gender;
  if (data.maritalStatus !== undefined) patch.maritalStatus = data.maritalStatus;
  // Marks: string in the form → number for storage.
  if (data.obtainedMarks !== undefined) {
    patch.obtainedMarks = data.obtainedMarks ? Number(data.obtainedMarks) : undefined;
  }
  if (data.totalMarks !== undefined) {
    patch.totalMarks = data.totalMarks ? Number(data.totalMarks) : undefined;
  }
  // Assigned rotation.
  if (data.assignedRotation !== undefined) {
    patch.assignedRotation = data.assignedRotation || null;
  }

  const updated = await getStore().update(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ application: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const ok = await getStore().remove(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

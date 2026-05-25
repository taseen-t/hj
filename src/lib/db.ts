import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Application, ApplicationInput } from "./types";
import { getSupabase, hasSupabase, photoBucket } from "./supabase";

export interface Store {
  create(input: ApplicationInput): Promise<Application>;
  list(): Promise<Application[]>;
  get(id: string): Promise<Application | null>;
  update(id: string, patch: { assignedRotation: string | null }): Promise<Application | null>;
  remove(id: string): Promise<boolean>;
}

const newId = () => crypto.randomUUID();
const newToken = () => crypto.randomBytes(24).toString("hex");

function buildRecord(
  input: ApplicationInput,
  photoUrl: string | null,
  id: string = newId()
): Application {
  const { photo: _photo, ...rest } = input;
  return {
    ...rest,
    universityStatus: rest.universityStatus || "",
    universityName: rest.universityName || "",
    preference2: rest.preference2 || "",
    preference3: rest.preference3 || "",
    preference4: rest.preference4 || "",
    obtainedMarks: rest.obtainedMarks ? Number(rest.obtainedMarks) : undefined,
    totalMarks: rest.totalMarks ? Number(rest.totalMarks) : undefined,
    id,
    createdAt: new Date().toISOString(),
    photoUrl,
    assignedRotation: null,
    downloadToken: newToken(),
  };
}

function decodeDataUrl(
  dataUrl: string
): { buffer: Buffer; contentType: string; ext: string } | null {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  const contentType = m[1];
  const ext = contentType.split("/")[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
  return { buffer: Buffer.from(m[2], "base64"), contentType, ext };
}

/* --------------------------- Local JSON store ---------------------------- */
/* Used automatically when no Supabase credentials are configured. Data lives
   in ./.data/applications.json; photos are kept inline as data URLs. */

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "applications.json");

let writeChain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readAll(): Promise<Application[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as Application[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeAll(rows: Application[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(rows, null, 2), "utf8");
}

class LocalStore implements Store {
  create(input: ApplicationInput): Promise<Application> {
    return withLock(async () => {
      const rows = await readAll();
      const rec = buildRecord(input, input.photo || null);
      rows.push(rec);
      await writeAll(rows);
      return rec;
    });
  }

  async list(): Promise<Application[]> {
    const rows = await readAll();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<Application | null> {
    return (await readAll()).find((r) => r.id === id) ?? null;
  }

  update(id: string, patch: { assignedRotation: string | null }): Promise<Application | null> {
    return withLock(async () => {
      const rows = await readAll();
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], assignedRotation: patch.assignedRotation };
      await writeAll(rows);
      return rows[idx];
    });
  }

  remove(id: string): Promise<boolean> {
    return withLock(async () => {
      const rows = await readAll();
      const next = rows.filter((r) => r.id !== id);
      if (next.length === rows.length) return false;
      await writeAll(next);
      return true;
    });
  }
}

/* ----------------------------- Supabase store ---------------------------- */

function toRow(a: Application) {
  return {
    id: a.id,
    created_at: a.createdAt,
    name: a.name,
    father_name: a.fatherName,
    place_of_birth: a.placeOfBirth,
    date_of_birth: a.dateOfBirth,
    religion: a.religion,
    nationality: a.nationality,
    gender: a.gender,
    cnic: a.cnic,
    marital_status: a.maritalStatus,
    district_of_domicile: a.districtOfDomicile,
    whatsapp: a.whatsapp,
    guardian_mobile: a.guardianMobile,
    mailing_address: a.mailingAddress,
    university_status: a.universityStatus || null,
    university_name: a.universityName || null,
    obtained_marks: a.obtainedMarks ?? null,
    total_marks: a.totalMarks ?? null,
    preference_1: a.preference1,
    preference_2: a.preference2 || null,
    preference_3: a.preference3 || null,
    preference_4: a.preference4 || null,
    assigned_rotation: a.assignedRotation,
    photo_url: a.photoUrl,
    download_token: a.downloadToken,
  };
}

function fromRow(r: Record<string, unknown>): Application {
  const s = (v: unknown) => (v == null ? "" : String(v));
  const n = (v: unknown) => (v == null ? undefined : Number(v));
  return {
    id: s(r.id),
    createdAt: s(r.created_at),
    name: s(r.name),
    fatherName: s(r.father_name),
    placeOfBirth: s(r.place_of_birth),
    dateOfBirth: s(r.date_of_birth),
    religion: s(r.religion),
    nationality: s(r.nationality),
    gender: s(r.gender) as Application["gender"],
    cnic: s(r.cnic),
    maritalStatus: s(r.marital_status) as Application["maritalStatus"],
    districtOfDomicile: s(r.district_of_domicile),
    whatsapp: s(r.whatsapp),
    guardianMobile: s(r.guardian_mobile),
    mailingAddress: s(r.mailing_address),
    universityStatus: s(r.university_status),
    universityName: s(r.university_name),
    obtainedMarks: n(r.obtained_marks),
    totalMarks: n(r.total_marks),
    preference1: s(r.preference_1),
    preference2: s(r.preference_2),
    preference3: s(r.preference_3),
    preference4: s(r.preference_4),
    assignedRotation: r.assigned_rotation == null ? null : String(r.assigned_rotation),
    photoUrl: r.photo_url == null ? null : String(r.photo_url),
    downloadToken: s(r.download_token),
  };
}

class SupabaseStore implements Store {
  async create(input: ApplicationInput): Promise<Application> {
    const id = newId();
    let photoUrl: string | null = null;

    if (input.photo) {
      const decoded = decodeDataUrl(input.photo);
      if (decoded) {
        const sb = getSupabase();
        const filePath = `${id}.${decoded.ext}`;
        const up = await sb.storage
          .from(photoBucket())
          .upload(filePath, decoded.buffer, { contentType: decoded.contentType, upsert: true });
        if (up.error) throw new Error(`Photo upload failed: ${up.error.message}`);
        photoUrl = sb.storage.from(photoBucket()).getPublicUrl(filePath).data.publicUrl;
      }
    }

    const rec = buildRecord(input, photoUrl, id);
    const { error } = await getSupabase().from("applications").insert(toRow(rec));
    if (error) throw new Error(error.message);
    return rec;
  }

  async list(): Promise<Application[]> {
    const { data, error } = await getSupabase()
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(fromRow);
  }

  async get(id: string): Promise<Application | null> {
    const { data, error } = await getSupabase()
      .from("applications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  }

  async update(
    id: string,
    patch: { assignedRotation: string | null }
  ): Promise<Application | null> {
    const { data, error } = await getSupabase()
      .from("applications")
      .update({ assigned_rotation: patch.assignedRotation })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  }

  async remove(id: string): Promise<boolean> {
    const sb = getSupabase();
    // Best-effort: remove the applicant's photo from storage so it isn't orphaned.
    const existing = await this.get(id);
    if (existing?.photoUrl) {
      const marker = `/object/public/${photoBucket()}/`;
      const i = existing.photoUrl.indexOf(marker);
      if (i >= 0) {
        const path = existing.photoUrl.slice(i + marker.length);
        const { error: rmErr } = await sb.storage.from(photoBucket()).remove([path]);
        if (rmErr) console.error("Failed to remove photo from storage:", rmErr.message);
      }
    }
    const { error } = await sb.from("applications").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }
}

/* ------------------------------- Factory --------------------------------- */

let store: Store | null = null;

export function getStore(): Store {
  if (!store) store = hasSupabase() ? new SupabaseStore() : new LocalStore();
  return store;
}

export function storeMode(): "supabase" | "local" {
  return hasSupabase() ? "supabase" : "local";
}

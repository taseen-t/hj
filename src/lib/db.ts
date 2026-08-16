import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import type { Application, ApplicationInput, ApplicationPatch } from "./types";
import { cnicNormalize } from "./types";
import { getSupabase, hasSupabase, photoBucket } from "./supabase";

export interface Store {
  create(input: ApplicationInput): Promise<Application>;
  list(): Promise<Application[]>;
  get(id: string): Promise<Application | null>;
  update(id: string, patch: ApplicationPatch): Promise<Application | null>;
  remove(id: string): Promise<boolean>;
  findByCnic(cnic: string): Promise<Application | null>;
}

const newId = () => crypto.randomUUID();
const newToken = () => crypto.randomBytes(24).toString("hex");

interface Attachments {
  photoUrl: string | null;
  pmdcCertificateUrl: string | null;
  finalYearResultUrl: string | null;
}

function buildRecord(
  input: ApplicationInput,
  attachments: Attachments,
  id: string = newId()
): Application {
  const {
    photo: _photo,
    pmdcCertificate: _pmdc,
    finalYearResult: _finalYear,
    ...rest
  } = input;
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
    seq: 0, // assigned by the store (auto-increment in Supabase, max+1 in local).
    createdAt: new Date().toISOString(),
    photoUrl: attachments.photoUrl,
    pmdcCertificateUrl: attachments.pmdcCertificateUrl,
    finalYearResultUrl: attachments.finalYearResultUrl,
    assignedRotation: null,
    downloadToken: newToken(),
  };
}

// Handles image/* and application/pdf data URLs.
function decodeDataUrl(
  dataUrl: string
): { buffer: Buffer; contentType: string; ext: string } | null {
  const m = dataUrl.match(/^data:([a-zA-Z0-9.+\/-]+);base64,(.+)$/);
  if (!m) return null;
  const contentType = m[1];
  let ext = (contentType.split("/")[1] || "bin").toLowerCase();
  ext = ext.replace("jpeg", "jpg").replace("svg+xml", "svg");
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
      const nextSeq =
        rows.reduce((m, r) => Math.max(m, r.seq || 0), 0) + 1;
      const rec = buildRecord(input, {
        photoUrl: input.photo || null,
        pmdcCertificateUrl: input.pmdcCertificate || null,
        finalYearResultUrl: input.finalYearResult || null,
      });
      rec.seq = nextSeq;
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

  update(id: string, patch: ApplicationPatch): Promise<Application | null> {
    return withLock(async () => {
      const rows = await readAll();
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch };
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

  async findByCnic(cnic: string): Promise<Application | null> {
    const target = cnicNormalize(cnic);
    const rows = await readAll();
    return rows.find((r) => cnicNormalize(r.cnic) === target) ?? null;
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
    pmdc_certificate_url: a.pmdcCertificateUrl,
    final_year_result_url: a.finalYearResultUrl,
    download_token: a.downloadToken,
  };
}

function fromRow(r: Record<string, unknown>): Application {
  const s = (v: unknown) => (v == null ? "" : String(v));
  const n = (v: unknown) => (v == null ? undefined : Number(v));
  return {
    id: s(r.id),
    seq: r.seq != null ? Number(r.seq) : 0,
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
    pmdcCertificateUrl:
      r.pmdc_certificate_url == null ? null : String(r.pmdc_certificate_url),
    finalYearResultUrl:
      r.final_year_result_url == null ? null : String(r.final_year_result_url),
    downloadToken: s(r.download_token),
  };
}

class SupabaseStore implements Store {
  // Uploads one data-URL attachment and returns its public URL.
  // `suffix` keeps the three files for an application distinct in the bucket.
  private async uploadAttachment(
    id: string,
    suffix: string,
    dataUrl: string | undefined,
    label: string
  ): Promise<string | null> {
    if (!dataUrl) return null;
    const decoded = decodeDataUrl(dataUrl);
    if (!decoded) return null;
    const sb = getSupabase();
    const filePath = suffix ? `${id}-${suffix}.${decoded.ext}` : `${id}.${decoded.ext}`;
    const up = await sb.storage
      .from(photoBucket())
      .upload(filePath, decoded.buffer, {
        contentType: decoded.contentType,
        upsert: true,
      });
    if (up.error) throw new Error(`${label} upload failed: ${up.error.message}`);
    return sb.storage.from(photoBucket()).getPublicUrl(filePath).data.publicUrl;
  }

  async create(input: ApplicationInput): Promise<Application> {
    const id = newId();

    const [photoUrl, pmdcCertificateUrl, finalYearResultUrl] = await Promise.all([
      this.uploadAttachment(id, "", input.photo, "Photo"),
      this.uploadAttachment(id, "pmdc", input.pmdcCertificate, "PMDC Certificate"),
      this.uploadAttachment(
        id,
        "final-year",
        input.finalYearResult,
        "Final year result card"
      ),
    ]);

    const rec = buildRecord(
      input,
      { photoUrl, pmdcCertificateUrl, finalYearResultUrl },
      id
    );
    const { data, error } = await getSupabase()
      .from("applications")
      .insert(toRow(rec))
      .select()
      .single();
    if (error) throw new Error(error.message);
    // Use the row returned from the DB so we get the auto-assigned `seq`.
    return data ? fromRow(data) : rec;
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
    patch: ApplicationPatch
  ): Promise<Application | null> {
    const colMap: Partial<Record<keyof ApplicationPatch, string>> = {
      name: "name",
      fatherName: "father_name",
      placeOfBirth: "place_of_birth",
      dateOfBirth: "date_of_birth",
      religion: "religion",
      nationality: "nationality",
      gender: "gender",
      cnic: "cnic",
      maritalStatus: "marital_status",
      districtOfDomicile: "district_of_domicile",
      whatsapp: "whatsapp",
      guardianMobile: "guardian_mobile",
      mailingAddress: "mailing_address",
      universityStatus: "university_status",
      universityName: "university_name",
      obtainedMarks: "obtained_marks",
      totalMarks: "total_marks",
      preference1: "preference_1",
      preference2: "preference_2",
      preference3: "preference_3",
      preference4: "preference_4",
      assignedRotation: "assigned_rotation",
      photoUrl: "photo_url",
      pmdcCertificateUrl: "pmdc_certificate_url",
      finalYearResultUrl: "final_year_result_url",
    };
    const row: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      const col = colMap[k as keyof ApplicationPatch];
      if (col) row[col] = v;
    }
    if (Object.keys(row).length === 0) {
      return this.get(id);
    }
    const { data, error } = await getSupabase()
      .from("applications")
      .update(row)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? fromRow(data) : null;
  }

  async findByCnic(cnic: string): Promise<Application | null> {
    const target = cnicNormalize(cnic);
    const list = await this.list();
    return list.find((r) => cnicNormalize(r.cnic) === target) ?? null;
  }

  async remove(id: string): Promise<boolean> {
    const sb = getSupabase();
    // Best-effort: remove the applicant's uploads from storage so they aren't
    // orphaned. Covers the photo and both supporting documents.
    const existing = await this.get(id);
    if (existing) {
      const marker = `/object/public/${photoBucket()}/`;
      const paths = [
        existing.photoUrl,
        existing.pmdcCertificateUrl,
        existing.finalYearResultUrl,
      ]
        .filter((u): u is string => Boolean(u))
        .map((url) => {
          const i = url.indexOf(marker);
          return i >= 0 ? url.slice(i + marker.length) : null;
        })
        .filter((p): p is string => Boolean(p));

      if (paths.length > 0) {
        const { error: rmErr } = await sb.storage.from(photoBucket()).remove(paths);
        if (rmErr) console.error("Failed to remove files from storage:", rmErr.message);
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

import { z } from "zod";

/* ----------------------------- Option lists ------------------------------ */

export const GENDERS = ["Male", "Female"] as const;

export const MARITAL_STATUSES = ["Single", "Married"] as const;

export const UNIVERSITY_STATUSES = [
  "Faisalabad Medical University",
  "Other Government / Punjab",
  "Other Government / Other Province",
  "Private Medical Colleges / Punjab",
  "Private Medical Colleges / Other Province",
  "Foreign Medical Colleges / University",
] as const;

// Annual session year used in the formatted reference ID (HJ-YYYY-NNNN).
// Change this for the next session.
export const SESSION_YEAR = 2026;

// Build a human-friendly reference ID. Falls back to the UUID slice when
// the sequence number isn't available yet (e.g. before the DB migration runs).
export function referenceIdFor(app: { seq?: number; id: string }): string {
  if (app.seq && app.seq > 0) {
    return `HJ-${SESSION_YEAR}-${String(app.seq).padStart(4, "0")}`;
  }
  return app.id.slice(0, 8).toUpperCase();
}

// Derived percentage from obtained/total marks. Returns "" if either is
// missing or invalid, so callers can render it as a placeholder.
export function computePercentage(
  obtained?: string | number | null,
  total?: string | number | null
): string {
  if (obtained == null || total == null || obtained === "" || total === "") return "";
  const o = Number(obtained);
  const t = Number(total);
  if (!Number.isFinite(o) || !Number.isFinite(t) || t <= 0 || o < 0) return "";
  return `${((o / t) * 100).toFixed(2)}%`;
}

// House-job rotations. Adjust this list to match your institution's offering.
export const ROTATIONS = [
  "Medicine",
  "Surgery",
  "Gynaecology & Obstetrics",
  "Paediatrics",
  "Orthopaedics",
  "Cardiology",
  "Ophthalmology",
  "ENT",
  "Dermatology",
  "Psychiatry",
  "Anaesthesia",
  "Radiology",
  "Emergency Medicine",
  "Urology",
  "Neurology",
  "Nephrology",
] as const;

/* ----------------------------- Validation -------------------------------- */

const requiredText = (label: string, min = 2) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, `${label} is required`);

const phone = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .regex(
      /^[0-9+\-\s]{10,15}$/,
      `Enter a valid ${label.toLowerCase()} (10-15 digits)`
    );

// CNIC / Passport: 5-18 chars, digits + letters + dashes only.
const cnicField = z
  .string({ required_error: "CNIC / Passport is required" })
  .trim()
  .min(5, "CNIC / Passport is required")
  .max(18, "CNIC / Passport is too long (max 18 characters)")
  .regex(/^[A-Za-z0-9\-\s]+$/, "Use only letters, digits, and dashes");

// Normalize CNIC for duplicate detection (ignore case, dashes, spaces).
export const cnicNormalize = (s: string) =>
  s.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

// Optional marks as a numeric string (kept as a string here; converted to a
// number in the data layer). Avoids zod transforms so the form types stay simple.
const optionalMarks = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Enter a valid number")
  .optional()
  .or(z.literal(""));

const requiredMarks = z
  .string({ required_error: "Marks are required" })
  .trim()
  .min(1, "Marks are required")
  .regex(/^\d+(\.\d+)?$/, "Enter a valid number");

const marksRefine = (d: { obtainedMarks?: string; totalMarks?: string }) => {
  if (!d.obtainedMarks || !d.totalMarks) return true;
  return Number(d.obtainedMarks) <= Number(d.totalMarks);
};
const marksRefineMsg = {
  message: "Obtained marks cannot exceed total marks",
  path: ["obtainedMarks"],
};

/* ---------------------------- Attachments -------------------------------- */

// Attachments travel as data URLs inside the submission JSON. Base64 inflates
// the payload by ~4/3, so the guard here is on the encoded string length.
//
// 1 MB each is a deliberate ceiling: three attachments at this size encode to
// roughly 4.1 MB, which stays under the ~4.5 MB request-body limit serverless
// hosts apply. Raising it makes submissions with two large scans fail outright.
export const MAX_ATTACHMENT_BYTES = 1024 * 1024;
export const MAX_ATTACHMENT_LABEL = "1 MB";
const MAX_ATTACHMENT_CHARS = Math.ceil(MAX_ATTACHMENT_BYTES * 1.4);

// SVG is excluded on purpose: it is an image to a browser but a script host in
// practice, and the admin opens these documents directly in a new tab.
const RASTER = "png|jpeg|jpg|webp|gif|heic|heif";

// A supporting document: a scan/photo or a PDF. Always optional.
const documentField = (label: string) =>
  z
    .string()
    .regex(
      new RegExp(`^data:(image/(${RASTER})|application/pdf);base64,`),
      `${label} must be a photo or a PDF`
    )
    .max(MAX_ATTACHMENT_CHARS, `${label} is too large (max ${MAX_ATTACHMENT_LABEL})`)
    .optional()
    .or(z.literal(""));

// Base object so we can derive both the input schema and a partial update schema.
const applicationFields = z.object({
  name: requiredText("Name"),
  fatherName: requiredText("Father name"),
  placeOfBirth: requiredText("Place of birth"),
  dateOfBirth: z
    .string({ required_error: "Date of birth is required" })
    .min(1, "Date of birth is required")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => Date.parse(v) <= Date.now(), "Date of birth cannot be in the future"),
  religion: requiredText("Religion"),
  nationality: requiredText("Nationality"),
  gender: z.enum(GENDERS, { errorMap: () => ({ message: "Select a gender" }) }),
  cnic: cnicField,
  maritalStatus: z.enum(MARITAL_STATUSES, {
    errorMap: () => ({ message: "Select marital status" }),
  }),
  districtOfDomicile: requiredText("District of domicile"),
  whatsapp: phone("WhatsApp number"),
  guardianMobile: phone("Guardian mobile number"),
  mailingAddress: requiredText("Mailing address", 5),
  universityStatus: z.enum(UNIVERSITY_STATUSES, {
    errorMap: () => ({ message: "Select a university / college status" }),
  }),
  universityName: requiredText("University / College name"),
  obtainedMarks: requiredMarks,
  totalMarks: requiredMarks,
  preference1: requiredText("First preferred rotation"),
  preference2: requiredText("Second preferred rotation"),
  preference3: requiredText("Third preferred rotation"),
  preference4: requiredText("Fourth preferred rotation"),
  // Photo arrives as a data URL string (data:image/...;base64,....).
  photo: z
    .string()
    // Requires base64 too — the previous prefix check let through data URLs
    // that the decoder then rejected, silently dropping the photo.
    .regex(new RegExp(`^data:image/(${RASTER});base64,`), "Photo must be a photo file")
    .max(MAX_ATTACHMENT_CHARS, `Photo is too large (max ${MAX_ATTACHMENT_LABEL})`)
    .optional()
    .or(z.literal("")),
});

// Supporting documents — both optional. PDF or image, sent as data URLs.
// They live outside `applicationFields` because only the public form uploads
// them; the admin edit screen never sends them back.
const submissionFields = applicationFields.extend({
  pmdcCertificate: documentField("PMDC Certificate"),
  finalYearResult: documentField("Final year result card"),
});

export const applicationInputSchema = submissionFields.refine(
  marksRefine,
  marksRefineMsg
);

// Used by the admin edit endpoint — every field optional, plus assignedRotation.
export const applicationUpdateSchema = applicationFields
  .partial()
  .extend({
    assignedRotation: z.string().trim().nullable().optional(),
  })
  .refine(marksRefine, marksRefineMsg);

export type ApplicationUpdate = z.infer<typeof applicationUpdateSchema>;

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

/* ------------------------------ Stored model ----------------------------- */

export interface Application
  extends Omit<
    ApplicationInput,
    | "photo"
    | "pmdcCertificate"
    | "finalYearResult"
    | "universityStatus"
    | "universityName"
    | "preference2"
    | "preference3"
    | "preference4"
    | "obtainedMarks"
    | "totalMarks"
  > {
  // Always stored (defaulted to "" when not provided) — never undefined.
  universityStatus: string;
  universityName: string;
  preference2: string;
  preference3: string;
  preference4: string;
  // Converted from the submitted strings to numbers in the data layer.
  obtainedMarks?: number;
  totalMarks?: number;
  id: string;
  seq: number;
  createdAt: string;
  photoUrl: string | null;
  pmdcCertificateUrl: string | null;
  finalYearResultUrl: string | null;
  assignedRotation: string | null;
  downloadToken: string;
}

// Fields the admin can edit on an existing application.
export type ApplicationPatch = Partial<
  Omit<Application, "id" | "createdAt" | "downloadToken">
>;

/* ------------------------- Labels for display/export --------------------- */

export const LABELS: Record<string, string> = {
  name: "Name",
  fatherName: "Father Name",
  placeOfBirth: "Place of Birth",
  dateOfBirth: "Date of Birth",
  religion: "Religion",
  nationality: "Nationality",
  gender: "Gender",
  cnic: "CNIC / Passport",
  maritalStatus: "Marital Status",
  districtOfDomicile: "District of Domicile",
  whatsapp: "WhatsApp Number",
  guardianMobile: "Guardian Mobile",
  mailingAddress: "Mailing Address",
  universityStatus: "University / College Status",
  universityName: "University / College Name",
  obtainedMarks: "Obtained Marks",
  totalMarks: "Total Marks",
  percentage: "Percentage",
  preference1: "Preference 1",
  preference2: "Preference 2",
  preference3: "Preference 3",
  preference4: "Preference 4",
  assignedRotation: "Assigned Rotation",
  pmdcCertificateUrl: "PMDC Certificate",
  finalYearResultUrl: "Final Year Result Card",
};

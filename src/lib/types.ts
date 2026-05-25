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
    .regex(/^[0-9+\-\s]{7,20}$/, `Enter a valid ${label.toLowerCase()}`);

// Optional marks as a numeric string (kept as a string here; converted to a
// number in the data layer). Avoids zod transforms so the form types stay simple.
const optionalMarks = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, "Enter a valid number")
  .optional()
  .or(z.literal(""));

export const applicationInputSchema = z
  .object({
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
    cnic: requiredText("CNIC / Passport", 5),
    maritalStatus: z.enum(MARITAL_STATUSES, {
      errorMap: () => ({ message: "Select marital status" }),
    }),
    districtOfDomicile: requiredText("District of domicile"),
    whatsapp: phone("WhatsApp number"),
    guardianMobile: phone("Guardian mobile number"),
    mailingAddress: requiredText("Mailing address", 5),
    universityStatus: z.string().trim().optional().or(z.literal("")),
    universityName: z.string().trim().optional().or(z.literal("")),
    obtainedMarks: optionalMarks,
    totalMarks: optionalMarks,
    preference1: requiredText("First preferred rotation"),
    preference2: z.string().trim().optional().or(z.literal("")),
    preference3: z.string().trim().optional().or(z.literal("")),
    preference4: z.string().trim().optional().or(z.literal("")),
    // Photo arrives as a data URL string (data:image/...;base64,....).
    photo: z
      .string()
      .startsWith("data:image/", "Photo must be an image")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (d) => {
      if (!d.obtainedMarks || !d.totalMarks) return true;
      return Number(d.obtainedMarks) <= Number(d.totalMarks);
    },
    { message: "Obtained marks cannot exceed total marks", path: ["obtainedMarks"] }
  );

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

/* ------------------------------ Stored model ----------------------------- */

export interface Application
  extends Omit<
    ApplicationInput,
    | "photo"
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
  createdAt: string;
  photoUrl: string | null;
  assignedRotation: string | null;
  downloadToken: string;
}

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
  preference1: "Preference 1",
  preference2: "Preference 2",
  preference3: "Preference 3",
  preference4: "Preference 4",
  assignedRotation: "Assigned Rotation",
};

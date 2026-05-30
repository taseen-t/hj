"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { CheckCircle2, Check, Copy, Download, Loader2, Upload, AlertCircle } from "lucide-react";
import {
  applicationInputSchema,
  computePercentage,
  GENDERS,
  MARITAL_STATUSES,
  ROTATIONS,
  UNIVERSITY_STATUSES,
  type ApplicationInput,
} from "@/lib/types";
import { downloadApplicationPdf } from "@/lib/pdf";
import { Field, SectionTitle } from "./fields";

const MAX_PHOTO = 2 * 1024 * 1024;

type Submitted = {
  values: ApplicationInput & { photo?: string };
  id: string;
  referenceId: string;
};

export default function ApplicationForm() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({ resolver: zodResolver(applicationInputSchema) });

  // Live percentage from the two marks fields.
  const obtainedRaw = watch("obtainedMarks");
  const totalRaw = watch("totalMarks");
  const percentText = useMemo(
    () => computePercentage(obtainedRaw, totalRaw),
    [obtainedRaw, totalRaw]
  );

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [downloading, setDownloading] = useState(false);

  const ic = (hasError?: unknown) => clsx("field-input", Boolean(hasError) && "invalid");

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return setPhoto(null);
    if (!file.type.startsWith("image/")) return setPhotoError("Please choose an image file.");
    if (file.size > MAX_PHOTO) return setPhotoError("Image must be under 2 MB.");
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: ApplicationInput) {
    setServerError(null);
    const payload = { ...values, photo: photo ?? undefined };
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setServerError(j.error || "Submission failed. Please try again.");
        return;
      }
      const j = await res.json();
      setSubmitted({
        values: payload,
        id: j.id,
        referenceId: j.referenceId || j.id.slice(0, 8).toUpperCase(),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setServerError("Network error. Please check your connection and try again.");
    }
  }

  async function handleDownload() {
    if (!submitted) return;
    setDownloading(true);
    try {
      await downloadApplicationPdf({
        ...submitted.values,
        referenceId: submitted.referenceId,
      });
    } finally {
      setDownloading(false);
    }
  }

  function startOver() {
    reset();
    setPhoto(null);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <div className="card overflow-hidden">
        <div className="bg-emerald-50 px-6 py-8 text-center sm:px-10">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Application submitted</h2>
          <p className="mt-1 text-slate-600">
            Thank you, <span className="font-semibold">{submitted.values.name}</span>. Your
            application has been recorded.
          </p>
        </div>
        <div className="space-y-5 px-6 py-6 sm:px-10">
          {/* Prominent Reference ID badge */}
          <div className="rounded-xl bg-brand-50 px-5 py-4 ring-1 ring-brand-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600">
                  Your Reference ID
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-brand-700">
                  {submitted.referenceId}
                </div>
              </div>
              <CopyButton value={submitted.referenceId} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Save this — you&apos;ll need it for any follow-up. It&apos;s also printed on the PDF.
            </p>
          </div>

          {photo && (
            <img
              src={photo}
              alt="Applicant"
              className="mx-auto h-28 w-24 rounded-lg object-cover ring-1 ring-slate-200"
            />
          )}
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Row k="Name" v={submitted.values.name} />
            <Row k="Father Name" v={submitted.values.fatherName} />
            <Row k="CNIC / Passport" v={submitted.values.cnic} />
            <Row k="Date of Birth" v={submitted.values.dateOfBirth} />
            <Row k="WhatsApp" v={submitted.values.whatsapp} />
          </dl>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button className="btn btn-primary flex-1" onClick={handleDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download my application (PDF)
            </button>
            <button className="btn btn-ghost flex-1" onClick={startOver}>
              Submit another application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <SectionTitle>Personal Information</SectionTitle>

        <Field
          label={
            <>
              Name{" "}
              <span className="font-normal text-slate-400">(as written on CNIC)</span>
            </>
          }
          required
          error={errors.name}
          htmlFor="name"
        >
          <input id="name" className={ic(errors.name)} placeholder="Full name" {...register("name")} />
        </Field>
        <Field label="Father Name" required error={errors.fatherName} htmlFor="fatherName">
          <input id="fatherName" className={ic(errors.fatherName)} placeholder="Father's name" {...register("fatherName")} />
        </Field>
        <Field label="Place of Birth" required error={errors.placeOfBirth} htmlFor="placeOfBirth">
          <input id="placeOfBirth" className={ic(errors.placeOfBirth)} {...register("placeOfBirth")} />
        </Field>
        <Field label="Date of Birth" required error={errors.dateOfBirth} htmlFor="dateOfBirth">
          <input id="dateOfBirth" type="date" className={ic(errors.dateOfBirth)} {...register("dateOfBirth")} />
        </Field>
        <Field label="Religion" required error={errors.religion} htmlFor="religion">
          <input id="religion" className={ic(errors.religion)} {...register("religion")} />
        </Field>
        <Field label="Nationality" required error={errors.nationality} htmlFor="nationality">
          <input id="nationality" className={ic(errors.nationality)} {...register("nationality")} />
        </Field>
        <Field label="Gender" required error={errors.gender} htmlFor="gender">
          <select id="gender" className={ic(errors.gender)} defaultValue="" {...register("gender")}>
            <option value="" disabled>
              Select gender
            </option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Field label="CNIC / Passport" required error={errors.cnic} htmlFor="cnic">
          <input
            id="cnic"
            maxLength={18}
            className={ic(errors.cnic)}
            placeholder="35202-1234567-1"
            {...register("cnic")}
          />
        </Field>
        <Field label="Marital Status" required error={errors.maritalStatus} htmlFor="maritalStatus">
          <select id="maritalStatus" className={ic(errors.maritalStatus)} defaultValue="" {...register("maritalStatus")}>
            <option value="" disabled>
              Select status
            </option>
            {MARITAL_STATUSES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="District of Domicile" required error={errors.districtOfDomicile} htmlFor="district">
          <input id="district" className={ic(errors.districtOfDomicile)} {...register("districtOfDomicile")} />
        </Field>

        <SectionTitle>Contact</SectionTitle>
        <Field label="Personal WhatsApp Number" required error={errors.whatsapp} htmlFor="whatsapp">
          <input
            id="whatsapp"
            inputMode="tel"
            maxLength={15}
            className={ic(errors.whatsapp)}
            placeholder="03001234567"
            {...register("whatsapp")}
          />
        </Field>
        <Field label="Guardian Mobile Number" required error={errors.guardianMobile} htmlFor="guardian">
          <input
            id="guardian"
            inputMode="tel"
            maxLength={15}
            className={ic(errors.guardianMobile)}
            placeholder="03001234567"
            {...register("guardianMobile")}
          />
        </Field>
        <Field label="Mailing Address" required error={errors.mailingAddress} htmlFor="address" full>
          <textarea
            id="address"
            rows={2}
            className={ic(errors.mailingAddress)}
            placeholder="e.g. House 12, Street 5, Block A, Faisalabad"
            {...register("mailingAddress")}
          />
        </Field>

        <SectionTitle>Academic Information</SectionTitle>
        <Field label="University / College Status" required error={errors.universityStatus} htmlFor="uniStatus">
          <select id="uniStatus" className={ic(errors.universityStatus)} defaultValue="" {...register("universityStatus")}>
            <option value="" disabled>
              Select status
            </option>
            {UNIVERSITY_STATUSES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Name of University / College" required error={errors.universityName} htmlFor="uniName">
          <input id="uniName" className={ic(errors.universityName)} {...register("universityName")} />
        </Field>
        <Field label="Obtained Marks" required error={errors.obtainedMarks} htmlFor="obtained">
          <input id="obtained" inputMode="numeric" className={ic(errors.obtainedMarks)} {...register("obtainedMarks")} />
        </Field>
        <Field label="Total Marks" required error={errors.totalMarks} htmlFor="total">
          <input id="total" inputMode="numeric" className={ic(errors.totalMarks)} {...register("totalMarks")} />
        </Field>
        <Field label="Percentage (auto)" htmlFor="percentage" full>
          <input
            id="percentage"
            readOnly
            tabIndex={-1}
            className="field-input bg-slate-50 font-mono text-slate-700"
            value={percentText}
            placeholder="Auto-calculated from obtained / total marks"
          />
        </Field>

        <SectionTitle>Preferred Rotations</SectionTitle>
        <Field label="1st Preference" required error={errors.preference1} htmlFor="pref1">
          <select id="pref1" className={ic(errors.preference1)} defaultValue="" {...register("preference1")}>
            <option value="" disabled>
              Select rotation
            </option>
            {ROTATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="2nd Preference" required error={errors.preference2} htmlFor="pref2">
          <select id="pref2" className={ic(errors.preference2)} defaultValue="" {...register("preference2")}>
            <option value="" disabled>
              Select rotation
            </option>
            {ROTATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="3rd Preference" required error={errors.preference3} htmlFor="pref3">
          <select id="pref3" className={ic(errors.preference3)} defaultValue="" {...register("preference3")}>
            <option value="" disabled>
              Select rotation
            </option>
            {ROTATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="4th Preference" required error={errors.preference4} htmlFor="pref4">
          <select id="pref4" className={ic(errors.preference4)} defaultValue="" {...register("preference4")}>
            <option value="" disabled>
              Select rotation
            </option>
            {ROTATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <SectionTitle>Photograph</SectionTitle>
        <div className="sm:col-span-2">
          <label
            htmlFor="photo"
            className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-4 transition hover:border-brand-300 hover:bg-brand-50"
          >
            {photo ? (
              <img src={photo} alt="Preview" className="h-20 w-16 rounded-md object-cover ring-1 ring-slate-200" />
            ) : (
              <span className="flex h-20 w-16 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">
                <Upload className="h-6 w-6 text-brand-400" />
              </span>
            )}
            <div className="text-sm">
              <p className="font-semibold text-brand-700">{photo ? "Change photo" : "Upload passport-size photo"}</p>
              <p className="text-slate-500">PNG or JPG, up to 2 MB</p>
            </div>
          </label>
          <input id="photo" type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          {photoError && <p className="field-error">{photoError}</p>}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {serverError && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">Fields marked * are required.</p>
          <button type="submit" className="btn btn-primary px-8" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed border-slate-200 py-1.5">
      <dt className="text-slate-500">{k}</dt>
      <dd className="font-medium text-slate-900">{v}</dd>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard not available — ignore */
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

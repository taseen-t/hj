"use client";

import { useMemo, useState } from "react";
import { useForm, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  Loader2,
  Paperclip,
  Upload,
} from "lucide-react";
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
import { RadioGroup, Row, TileGroup } from "./fields";
import Stepper, { type Step } from "./Stepper";

const MAX_PHOTO = 2 * 1024 * 1024;

// A picked supporting document — the data URL we submit plus the original
// filename, which is all we can show for a PDF (no inline preview).
type DocFile = { dataUrl: string; name: string };

type Submitted = {
  values: ApplicationInput & { photo?: string };
  id: string;
  referenceId: string;
};

// Each step validates only its own fields before advancing.
const STEPS: readonly (Step & { fields: Path<ApplicationInput>[] })[] = [
  {
    id: "personal",
    label: "Personal information",
    fields: [
      "name",
      "fatherName",
      "placeOfBirth",
      "dateOfBirth",
      "religion",
      "nationality",
      "gender",
      "cnic",
      "maritalStatus",
      "districtOfDomicile",
    ],
  },
  {
    id: "contact",
    label: "Contact details",
    fields: ["whatsapp", "guardianMobile", "mailingAddress"],
  },
  {
    id: "academic",
    label: "Academic information",
    fields: ["universityStatus", "universityName", "obtainedMarks", "totalMarks"],
  },
  {
    id: "rotations",
    label: "Preferred rotations",
    fields: ["preference1", "preference2", "preference3", "preference4"],
  },
  { id: "attachments", label: "Photo & documents", fields: [] },
  { id: "review", label: "Confirm details", fields: [] },
];

export default function ApplicationForm() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationInput>({
    resolver: zodResolver(applicationInputSchema),
    mode: "onTouched",
  });

  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pmdc, setPmdc] = useState<DocFile | null>(null);
  const [pmdcError, setPmdcError] = useState<string | null>(null);
  const [finalYear, setFinalYear] = useState<DocFile | null>(null);
  const [finalYearError, setFinalYearError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [downloading, setDownloading] = useState(false);

  const ic = (hasError?: unknown) => clsx("field-input", Boolean(hasError) && "invalid");

  const obtainedRaw = watch("obtainedMarks");
  const totalRaw = watch("totalMarks");
  const percentText = useMemo(
    () => computePercentage(obtainedRaw, totalRaw),
    [obtainedRaw, totalRaw]
  );

  const gender = watch("gender");
  const maritalStatus = watch("maritalStatus");

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

  // Shared picker for the supporting documents (image or PDF, max 2 MB).
  function onDocument(
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: DocFile | null) => void,
    setError: (m: string | null) => void
  ) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return setFile(null);
    const isAllowed = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!isAllowed) return setError("Please choose an image or a PDF file.");
    if (file.size > MAX_PHOTO) return setError("File must be under 2 MB.");
    const reader = new FileReader();
    reader.onload = () => setFile({ dataUrl: reader.result as string, name: file.name });
    reader.readAsDataURL(file);
  }

  async function goNext() {
    const fields = STEPS[step].fields;
    // Empty field list (attachments/review) has nothing to validate.
    if (fields.length > 0) {
      const ok = await trigger(fields, { shouldFocus: true });
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setServerError(null);
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit(values: ApplicationInput) {
    setServerError(null);
    const payload = {
      ...values,
      photo: photo ?? undefined,
      pmdcCertificate: pmdc?.dataUrl ?? undefined,
      finalYearResult: finalYear?.dataUrl ?? undefined,
    };
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
    setPmdc(null);
    setFinalYear(null);
    setSubmitted(null);
    setStep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ------------------------------ Success view ---------------------------- */
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt="Applicant"
              className="mx-auto h-28 w-24 rounded-lg object-cover ring-1 ring-slate-200"
            />
          )}
          <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <SummaryRow k="Name" v={submitted.values.name} />
            <SummaryRow k="Father Name" v={submitted.values.fatherName} />
            <SummaryRow k="CNIC / Passport" v={submitted.values.cnic} />
            <SummaryRow k="Date of Birth" v={submitted.values.dateOfBirth} />
            <SummaryRow k="WhatsApp" v={submitted.values.whatsapp} />
          </dl>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              className="btn btn-primary flex-1"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
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

  const isLast = step === STEPS.length - 1;

  /* -------------------------------- Wizard -------------------------------- */
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card overflow-hidden">
      <div className="grid lg:grid-cols-[248px_1fr]">
        {/* Desktop stepper sidebar */}
        <aside className="hidden border-r border-slate-200 bg-slate-50/60 p-6 lg:block">
          <Stepper
            steps={STEPS}
            current={step}
            orientation="vertical"
            onStepClick={setStep}
          />
        </aside>

        <div className="p-6 sm:p-8 lg:p-10">
          {/* Compact stepper for small screens */}
          <div className="mb-7 lg:hidden">
            <Stepper
              steps={STEPS}
              current={step}
              orientation="horizontal"
              onStepClick={setStep}
            />
          </div>

          <h2 className="hidden text-xl font-bold text-slate-900 lg:block">
            {STEPS[step].label}
          </h2>
          <p className="hidden text-sm text-slate-400 lg:block">
            Step {step + 1} of {STEPS.length}
          </p>

          <div className="mt-6">
            {step === 0 && (
              <>
                <Row
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
                </Row>
                <Row label="Father name" required error={errors.fatherName} htmlFor="fatherName">
                  <input
                    id="fatherName"
                    className={ic(errors.fatherName)}
                    placeholder="Father's name"
                    {...register("fatherName")}
                  />
                </Row>
                <Row label="Place of birth" required error={errors.placeOfBirth} htmlFor="placeOfBirth">
                  <input id="placeOfBirth" className={ic(errors.placeOfBirth)} {...register("placeOfBirth")} />
                </Row>
                <Row label="Date of birth" required error={errors.dateOfBirth} htmlFor="dateOfBirth">
                  <input
                    id="dateOfBirth"
                    type="date"
                    className={ic(errors.dateOfBirth)}
                    {...register("dateOfBirth")}
                  />
                </Row>
                <Row label="Religion" required error={errors.religion} htmlFor="religion">
                  <input id="religion" className={ic(errors.religion)} {...register("religion")} />
                </Row>
                <Row label="Nationality" required error={errors.nationality} htmlFor="nationality">
                  <input id="nationality" className={ic(errors.nationality)} {...register("nationality")} />
                </Row>
                <Row label="Gender" required error={errors.gender}>
                  <TileGroup
                    name="Gender"
                    value={gender ?? ""}
                    onChange={(v) =>
                      setValue("gender", v as ApplicationInput["gender"], {
                        shouldValidate: true,
                      })
                    }
                    options={GENDERS.map((g) => ({ value: g, label: g }))}
                  />
                </Row>
                <Row
                  label="CNIC / Passport"
                  hint="Digits and dashes only"
                  required
                  error={errors.cnic}
                  htmlFor="cnic"
                >
                  <input
                    id="cnic"
                    maxLength={18}
                    className={ic(errors.cnic)}
                    placeholder="35202-1234567-1"
                    {...register("cnic")}
                  />
                </Row>
                <Row label="Marital status" required error={errors.maritalStatus}>
                  <RadioGroup
                    name="Marital status"
                    options={MARITAL_STATUSES}
                    value={maritalStatus ?? ""}
                    onChange={(v) =>
                      setValue("maritalStatus", v as ApplicationInput["maritalStatus"], {
                        shouldValidate: true,
                      })
                    }
                  />
                </Row>
                <Row
                  label="District of domicile"
                  required
                  error={errors.districtOfDomicile}
                  htmlFor="district"
                >
                  <input
                    id="district"
                    className={ic(errors.districtOfDomicile)}
                    {...register("districtOfDomicile")}
                  />
                </Row>
              </>
            )}

            {step === 1 && (
              <>
                <Row
                  label="Personal WhatsApp number"
                  hint="We use this to contact you"
                  required
                  error={errors.whatsapp}
                  htmlFor="whatsapp"
                >
                  <input
                    id="whatsapp"
                    inputMode="tel"
                    maxLength={15}
                    className={ic(errors.whatsapp)}
                    placeholder="03001234567"
                    {...register("whatsapp")}
                  />
                </Row>
                <Row
                  label="Guardian mobile number"
                  required
                  error={errors.guardianMobile}
                  htmlFor="guardian"
                >
                  <input
                    id="guardian"
                    inputMode="tel"
                    maxLength={15}
                    className={ic(errors.guardianMobile)}
                    placeholder="03001234567"
                    {...register("guardianMobile")}
                  />
                </Row>
                <Row
                  label="Mailing address"
                  required
                  error={errors.mailingAddress}
                  htmlFor="address"
                >
                  <textarea
                    id="address"
                    rows={3}
                    className={ic(errors.mailingAddress)}
                    placeholder="e.g. House 12, Street 5, Block A, Faisalabad"
                    {...register("mailingAddress")}
                  />
                </Row>
              </>
            )}

            {step === 2 && (
              <>
                <Row
                  label="University / college status"
                  required
                  error={errors.universityStatus}
                  htmlFor="uniStatus"
                >
                  <select
                    id="uniStatus"
                    className={ic(errors.universityStatus)}
                    defaultValue=""
                    {...register("universityStatus")}
                  >
                    <option value="" disabled>
                      Select status
                    </option>
                    {UNIVERSITY_STATUSES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </Row>
                <Row
                  label="Name of university / college"
                  required
                  error={errors.universityName}
                  htmlFor="uniName"
                >
                  <input id="uniName" className={ic(errors.universityName)} {...register("universityName")} />
                </Row>
                <Row label="Obtained marks" required error={errors.obtainedMarks} htmlFor="obtained">
                  <input
                    id="obtained"
                    inputMode="numeric"
                    className={ic(errors.obtainedMarks)}
                    {...register("obtainedMarks")}
                  />
                </Row>
                <Row label="Total marks" required error={errors.totalMarks} htmlFor="total">
                  <input
                    id="total"
                    inputMode="numeric"
                    className={ic(errors.totalMarks)}
                    {...register("totalMarks")}
                  />
                </Row>
                <Row label="Percentage" hint="Calculated automatically" htmlFor="percentage">
                  <input
                    id="percentage"
                    readOnly
                    tabIndex={-1}
                    className="field-input bg-slate-50 font-mono text-slate-700"
                    value={percentText}
                    placeholder="Auto-calculated from obtained / total marks"
                  />
                </Row>
              </>
            )}

            {step === 3 && (
              <>
                {(
                  [
                    ["1st preference", "preference1", errors.preference1],
                    ["2nd preference", "preference2", errors.preference2],
                    ["3rd preference", "preference3", errors.preference3],
                    ["4th preference", "preference4", errors.preference4],
                  ] as const
                ).map(([label, name, err]) => (
                  <Row key={name} label={label} required error={err} htmlFor={name}>
                    <select
                      id={name}
                      className={ic(err)}
                      defaultValue=""
                      {...register(name as Path<ApplicationInput>)}
                    >
                      <option value="" disabled>
                        Select rotation
                      </option>
                      {ROTATIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </Row>
                ))}
              </>
            )}

            {step === 4 && (
              <>
                <Row label="Passport-size photo" hint="PNG or JPG, up to 2 MB">
                  <label
                    htmlFor="photo"
                    className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-4 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt="Preview"
                        className="h-20 w-16 rounded-md object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <span className="flex h-20 w-16 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">
                        <Upload className="h-6 w-6 text-brand-400" />
                      </span>
                    )}
                    <div className="text-sm">
                      <p className="font-semibold text-brand-700">
                        {photo ? "Change photo" : "Upload photo"}
                      </p>
                      <p className="text-slate-500">PNG or JPG, up to 2 MB</p>
                    </div>
                  </label>
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPhoto}
                  />
                  {photoError && <p className="field-error">{photoError}</p>}
                </Row>
                <Row label="PMDC certificate" hint="Optional">
                  <DocumentUpload
                    id="pmdcCertificate"
                    title="Attach PMDC Certificate"
                    file={pmdc}
                    error={pmdcError}
                    onChange={(e) => onDocument(e, setPmdc, setPmdcError)}
                  />
                </Row>
                <Row label="Final year result card" hint="Optional">
                  <DocumentUpload
                    id="finalYearResult"
                    title="Attach Final Year result card"
                    file={finalYear}
                    error={finalYearError}
                    onChange={(e) => onDocument(e, setFinalYear, setFinalYearError)}
                  />
                </Row>
              </>
            )}

            {step === 5 && (
              <ReviewStep
                values={getValues()}
                percent={percentText}
                photo={photo}
                pmdc={pmdc}
                finalYear={finalYear}
                onEdit={setStep}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 space-y-4">
            {serverError && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              {step > 0 ? (
                <button type="button" onClick={goBack} className="btn btn-ghost">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <p className="text-xs text-slate-400">Fields marked * are required.</p>
              )}

              {isLast ? (
                <button type="submit" className="btn btn-primary px-8" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Submitting..." : "Submit application"}
                </button>
              ) : (
                <button type="button" onClick={goNext} className="btn btn-primary px-8">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

/* -------------------------------- Helpers -------------------------------- */

function ReviewStep({
  values,
  percent,
  photo,
  pmdc,
  finalYear,
  onEdit,
}: {
  values: Partial<ApplicationInput>;
  percent: string;
  photo: string | null;
  pmdc: DocFile | null;
  finalYear: DocFile | null;
  onEdit: (step: number) => void;
}) {
  const groups: { title: string; step: number; items: [string, string][] }[] = [
    {
      title: "Personal information",
      step: 0,
      items: [
        ["Name", values.name ?? ""],
        ["Father name", values.fatherName ?? ""],
        ["Place of birth", values.placeOfBirth ?? ""],
        ["Date of birth", values.dateOfBirth ?? ""],
        ["Religion", values.religion ?? ""],
        ["Nationality", values.nationality ?? ""],
        ["Gender", values.gender ?? ""],
        ["CNIC / Passport", values.cnic ?? ""],
        ["Marital status", values.maritalStatus ?? ""],
        ["District of domicile", values.districtOfDomicile ?? ""],
      ],
    },
    {
      title: "Contact details",
      step: 1,
      items: [
        ["WhatsApp", values.whatsapp ?? ""],
        ["Guardian mobile", values.guardianMobile ?? ""],
        ["Mailing address", values.mailingAddress ?? ""],
      ],
    },
    {
      title: "Academic information",
      step: 2,
      items: [
        ["University status", values.universityStatus ?? ""],
        ["University name", values.universityName ?? ""],
        ["Obtained marks", values.obtainedMarks ?? ""],
        ["Total marks", values.totalMarks ?? ""],
        ["Percentage", percent],
      ],
    },
    {
      title: "Preferred rotations",
      step: 3,
      items: [
        ["1st preference", values.preference1 ?? ""],
        ["2nd preference", values.preference2 ?? ""],
        ["3rd preference", values.preference3 ?? ""],
        ["4th preference", values.preference4 ?? ""],
      ],
    },
    {
      title: "Photo & documents",
      step: 4,
      items: [
        ["Photograph", photo ? "Attached" : "Not attached"],
        ["PMDC certificate", pmdc ? pmdc.name : "Not attached"],
        ["Final year result", finalYear ? finalYear.name : "Not attached"],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Please check your details below. Use <span className="font-medium">Edit</span> to
        change anything before submitting.
      </p>
      {groups.map((g) => (
        <div key={g.title} className="rounded-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-slate-900">{g.title}</h3>
            <button
              type="button"
              onClick={() => onEdit(g.step)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Edit
            </button>
          </div>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-1.5 px-4 py-3 text-sm sm:grid-cols-2">
            {g.items.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-0.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium text-slate-900">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function DocumentUpload({
  id,
  title,
  file,
  error,
  onChange,
}: {
  id: string;
  title: string;
  file: DocFile | null;
  error: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex h-full cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 p-4 transition hover:border-brand-300 hover:bg-brand-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">
          {file ? (
            <FileCheck2 className="h-5 w-5 text-emerald-600" />
          ) : (
            <Paperclip className="h-5 w-5 text-brand-400" />
          )}
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-brand-700">{title}</p>
          <p className="truncate text-slate-500">
            {file ? file.name : "Optional — image or PDF, up to 2 MB"}
          </p>
        </div>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={onChange}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
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

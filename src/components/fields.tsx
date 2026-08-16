import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";
import { clsx } from "clsx";

/**
 * A wizard form row: label (plus optional hint) on the left, control on the
 * right at >= sm, stacked on mobile.
 */
export function Row({
  label,
  hint,
  required,
  error,
  htmlFor,
  children,
}: {
  label: ReactNode;
  hint?: string;
  required?: boolean;
  error?: FieldError;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 border-b border-slate-100 py-4 last:border-b-0 sm:grid-cols-[190px_1fr] sm:items-start sm:gap-6">
      <div className="sm:pt-2.5">
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      <div className="min-w-0">
        {children}
        {error?.message && <p className="field-error">{error.message}</p>}
      </div>
    </div>
  );
}

/** Segmented tile selector — used where there are few, glanceable options. */
export function TileGroup({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly { value: string; label: string; icon?: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={clsx(
              "flex min-w-[104px] flex-col items-center gap-1.5 rounded-xl border px-5 py-3 text-sm font-medium transition",
              selected
                ? "border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500"
                : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Stacked radio list, matching the mockup's option rows. */
export function RadioGroup({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const selected = value === o;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o)}
            className="flex w-full items-center gap-3 text-left text-sm text-slate-700"
          >
            <span
              className={clsx(
                "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition",
                selected ? "border-brand-600" : "border-slate-300"
              )}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-brand-600" />}
            </span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="sm:col-span-2 mt-2 border-b border-slate-200 pb-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">{children}</h2>
    </div>
  );
}

/** Legacy single-column field wrapper, kept for non-wizard surfaces. */
export function Field({
  label,
  required,
  error,
  htmlFor,
  full,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  error?: FieldError;
  htmlFor?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>
      {children}
      {error?.message && <p className="field-error">{error.message}</p>}
    </div>
  );
}

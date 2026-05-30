import type { ReactNode } from "react";
import type { FieldError } from "react-hook-form";

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

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="sm:col-span-2 mt-2 border-b border-slate-200 pb-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">{children}</h2>
    </div>
  );
}

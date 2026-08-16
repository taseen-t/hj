"use client";

import { Check } from "lucide-react";
import { clsx } from "clsx";

export type Step = { id: string; label: string };

/**
 * Progress indicator for the application wizard.
 * `orientation="vertical"` is the desktop sidebar; `"horizontal"` is the
 * compact bar shown above the content on smaller screens.
 */
export default function Stepper({
  steps,
  current,
  onStepClick,
  orientation,
}: {
  steps: readonly Step[];
  current: number;
  onStepClick?: (index: number) => void;
  orientation: "vertical" | "horizontal";
}) {
  if (orientation === "horizontal") {
    return (
      <div>
        <ol className="flex items-center">
          {steps.map((step, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={step.id} className="flex flex-1 items-center last:flex-none">
                <button
                  type="button"
                  onClick={done && onStepClick ? () => onStepClick(i) : undefined}
                  disabled={!done}
                  aria-current={active ? "step" : undefined}
                  aria-label={step.label}
                  className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
                    done && "bg-brand-600 text-white hover:bg-brand-700",
                    active && "bg-brand-600 text-white ring-4 ring-brand-500/20",
                    !done && !active && "bg-slate-200 text-slate-500"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <span
                    className={clsx(
                      "mx-1.5 h-0.5 flex-1 rounded",
                      i < current ? "bg-brand-600" : "bg-slate-200"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-sm font-semibold text-slate-900">
          {steps[current]?.label}
          <span className="ml-2 text-xs font-normal text-slate-400">
            Step {current + 1} of {steps.length}
          </span>
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-1">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={done && onStepClick ? () => onStepClick(i) : undefined}
              disabled={!done}
              aria-current={active ? "step" : undefined}
              className={clsx(
                "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition",
                done && "cursor-pointer hover:bg-slate-50",
                !done && !active && "cursor-default"
              )}
            >
              <span
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition",
                  done && "bg-brand-600 text-white",
                  active && "bg-brand-600 text-white ring-4 ring-brand-500/20",
                  !done && !active && "border-2 border-slate-300 bg-white text-slate-400"
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={clsx(
                  "text-sm",
                  active ? "font-semibold text-slate-900" : "text-slate-500"
                )}
              >
                {step.label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

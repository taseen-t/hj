"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { SESSION_YEAR } from "@/lib/types";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Logo className="h-9 w-9 shrink-0 text-brand-400" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight text-brand-950 sm:text-[15px]">
                House Job Application{" "}
                <span className="font-semibold text-brand-600">
                  {SESSION_YEAR}–{SESSION_YEAR + 1}
                </span>
              </span>
              <span className="block truncate text-xs leading-tight text-slate-500">
                Allied Hospital-I / II &amp; FTH, Faisalabad
              </span>
            </span>
          </Link>

          {/* Desktop */}
          <Link
            href="/admin"
            className="hidden shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:inline-flex"
          >
            Admin Login
          </Link>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 sm:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Panel and its click-catcher live outside <nav>: the nav's
          backdrop-blur would otherwise become the containing block for these
          fixed elements. Both stay mounted so closing animates too. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={clsx(
          "fixed inset-0 z-40 bg-slate-900/10 transition-opacity duration-300 ease-in-out sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <div
        id="mobile-menu"
        aria-hidden={!open}
        // Inline transform rather than the translate/scale utilities: Tailwind
        // emits the `transform` declaration for some of that family but not
        // all, so an explicit value on both sides keeps it interpolatable.
        style={{
          opacity: open ? 1 : 0,
          transform: open
            ? "translateY(0) scale(1)"
            : "translateY(-10px) scale(0.96)",
        }}
        className={clsx(
          "fixed right-3 top-[4.75rem] z-50 w-52 origin-top-right rounded-2xl border border-white/60 bg-white/70 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-xl transition-all duration-300 ease-in-out sm:hidden",
          !open && "pointer-events-none"
        )}
      >
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
          className="block rounded-xl bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Admin Login
        </Link>
      </div>
    </>
  );
}

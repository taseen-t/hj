"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { SESSION_YEAR } from "@/lib/types";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-950 text-white">
            <Logo className="h-5 w-5" />
          </span>
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

        {/* Desktop: plain button */}
        <Link
          href="/admin"
          className="hidden shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:inline-flex"
        >
          Admin Login
        </Link>

        {/* Mobile: collapsed into a menu */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 sm:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <>
          {/* Tap anywhere outside to dismiss */}
          <div
            className="fixed inset-0 z-30 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-40 border-t border-slate-200 bg-white px-4 py-3 sm:hidden">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Admin Login
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}

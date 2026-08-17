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

      {/* Drawer and backdrop live outside <nav>: the nav's backdrop-blur would
          otherwise become the containing block for these fixed elements. Both
          stay mounted so opening and closing are equally animated. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={clsx(
          "fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 ease-in-out sm:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        id="mobile-menu"
        aria-hidden={!open}
        // Inline transform rather than the translate-x-* utilities: Tailwind
        // emits the `transform` declaration with .translate-x-full but not
        // with .translate-x-0, so the pair is asymmetric and the open state
        // ends up with no transform at all. An explicit value on both sides
        // keeps the slide interpolatable in each direction.
        style={{ transform: open ? "translateX(0)" : "translateX(100%)" }}
        className={clsx(
          "fixed right-0 top-0 z-50 flex h-full w-1/2 min-w-[190px] flex-col border-l border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-in-out sm:hidden",
          !open && "pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">Menu</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            tabIndex={open ? 0 : -1}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="block rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Admin Login
          </Link>
        </div>
      </aside>
    </>
  );
}

import Link from "next/link";
import Logo from "./Logo";
import { SESSION_YEAR } from "@/lib/types";

export default function Navbar() {
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
            <span className="hidden truncate text-xs leading-tight text-slate-500 sm:block">
              Allied Hospital-I / II &amp; FTH, Faisalabad
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 sm:px-4 sm:text-sm"
          >
            Apply
          </Link>
          <Link
            href="/admin"
            className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 sm:px-4 sm:text-sm"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

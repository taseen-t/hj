import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-950 text-white">
            <Logo className="h-[18px] w-[18px]" />
          </span>
          <span className="text-sm font-bold text-brand-950 sm:text-base">House Job Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 sm:px-4 sm:text-sm"
          >
            Application Form
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

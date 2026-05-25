import Link from "next/link";
import ApplicationForm from "@/components/ApplicationForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 px-6 py-9 text-center text-white shadow-lift sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-200">
          Annual Session 2026 - 2027
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">
          Application Form for House Job
        </h1>
        <p className="mt-2 text-sm text-brand-100">
          Allied Hospital-I / II &amp; FTH, Faisalabad
        </p>
        <p className="mx-auto mt-4 max-w-lg border-t border-white/15 pt-3 text-xs text-brand-200">
          Software Developed by Dr. Rabiya Tariq &amp; Mohammad Taseen Tariq
        </p>
      </header>

      <ApplicationForm />

      <footer className="mt-8 space-y-1.5 text-center text-xs text-slate-400">
        <p>
          Made by{" "}
          <span className="font-medium text-slate-500">
            Dr. Rabiya Tariq &amp; Mohammad Taseen Tariq
          </span>
        </p>
        <p>
          <Link href="/admin" className="transition hover:text-slate-600">
            Administrator login
          </Link>
        </p>
      </footer>
    </main>
  );
}

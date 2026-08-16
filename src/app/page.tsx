import Link from "next/link";
import ApplicationForm from "@/components/ApplicationForm";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <h1 className="sr-only">
        Application Form for House Job — Allied Hospital-I / II &amp; FTH, Faisalabad
      </h1>

      <ApplicationForm />

      <footer className="mt-8 text-center text-xs text-slate-400">
        <Link href="/admin" className="transition hover:text-slate-600">
          Administrator login
        </Link>
      </footer>
    </main>
  );
}

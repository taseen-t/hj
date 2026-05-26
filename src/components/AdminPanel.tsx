"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  FileSpreadsheet,
  Loader2,
  LogOut,
  Lock,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  GENDERS,
  LABELS,
  MARITAL_STATUSES,
  referenceIdFor,
  ROTATIONS,
  UNIVERSITY_STATUSES,
  type Application,
} from "@/lib/types";

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [apps, setApps] = useState<Application[]>([]);
  const [mode, setMode] = useState<"local" | "supabase">("local");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const j = await res.json();
      setApps(j.applications ?? []);
      setMode(j.mode ?? "local");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/me");
      const j = await res.json();
      setAuthed(Boolean(j.authed));
      if (j.authed) loadApps();
    })();
  }, [loadApps]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (!res.ok) {
        setLoginError("Incorrect passcode.");
        return;
      }
      setAuthed(true);
      setPasscode("");
      loadApps();
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setApps([]);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) =>
      [
        a.name,
        a.fatherName,
        a.cnic,
        a.districtOfDomicile,
        referenceIdFor(a),
      ].some((v) => v?.toLowerCase().includes(q))
    );
  }, [apps, query]);

  /* ----------------------------- Loading ----------------------------- */
  if (authed === null) {
    return (
      <div className="flex min-h-[78vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  /* ----------------------------- Login ------------------------------- */
  if (!authed) {
    return (
      <main className="flex min-h-[78vh] items-center justify-center px-4">
        <form onSubmit={login} className="card w-full max-w-sm p-8">
          <div className="mb-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Lock className="h-6 w-6" />
            </span>
            <h1 className="mt-3 text-xl font-bold text-slate-900">Admin Access</h1>
            <p className="mt-1 text-sm text-slate-500">Enter the passcode to view applications.</p>
          </div>
          <label className="field-label" htmlFor="passcode">
            Passcode
          </label>
          <input
            id="passcode"
            type="password"
            autoFocus
            className="field-input"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="••••••••"
          />
          {loginError && <p className="field-error">{loginError}</p>}
          <button type="submit" className="btn btn-primary mt-5 w-full" disabled={loggingIn}>
            {loggingIn && <Loader2 className="h-4 w-4 animate-spin" />}
            Unlock
          </button>
        </form>
      </main>
    );
  }

  /* ----------------------------- Dashboard --------------------------- */
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500">
            {apps.length} total ·{" "}
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
              {mode === "supabase" ? "Supabase" : "Local storage"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadApps} className="btn btn-ghost" title="Refresh">
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </button>
          <a href="/api/admin/export" className="btn btn-primary">
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </a>
          <button onClick={logout} className="btn btn-ghost">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="field-input pl-9"
          placeholder="Search by name, father, CNIC, district, ref ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Photo</th>
                <th className="px-4 py-3 font-semibold">Ref ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Father</th>
                <th className="px-4 py-3 font-semibold">CNIC</th>
                <th className="px-4 py-3 font-semibold">University status</th>
                <th className="px-4 py-3 font-semibold">Marks</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
                <th className="px-4 py-3 font-semibold">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="cursor-pointer transition hover:bg-brand-50/40"
                >
                  <td className="px-4 py-2.5">
                    {a.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.photoUrl} alt="" className="h-10 w-9 rounded object-cover ring-1 ring-slate-200" />
                    ) : (
                      <span className="flex h-10 w-9 items-center justify-center rounded bg-slate-100 text-[10px] text-slate-400">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold tracking-wider text-brand-700">
                    {referenceIdFor(a)}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900">{a.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.fatherName}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.cnic}</td>
                  <td className="px-4 py-2.5 text-slate-600">{a.universityStatus || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {a.obtainedMarks !== undefined && a.totalMarks !== undefined
                      ? `${a.obtainedMarks} / ${a.totalMarks}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    {a.assignedRotation ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {a.assignedRotation}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    {loading ? "Loading…" : "No applications found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailDrawer
          app={selected}
          onClose={() => setSelected(null)}
          onChanged={(updated) => {
            setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelected(updated);
          }}
          onDeleted={(id) => {
            setApps((prev) => prev.filter((a) => a.id !== id));
            setSelected(null);
          }}
        />
      )}
    </main>
  );
}

/* ------------------------------ Detail drawer ----------------------------- */

type EditForm = {
  name: string;
  fatherName: string;
  placeOfBirth: string;
  dateOfBirth: string;
  religion: string;
  nationality: string;
  gender: "" | "Male" | "Female";
  cnic: string;
  maritalStatus: "" | "Single" | "Married";
  districtOfDomicile: string;
  whatsapp: string;
  guardianMobile: string;
  mailingAddress: string;
  universityStatus: string;
  universityName: string;
  obtainedMarks: string;
  totalMarks: string;
  preference1: string;
  preference2: string;
  preference3: string;
  preference4: string;
  assignedRotation: string;
};

function toForm(a: Application): EditForm {
  return {
    name: a.name,
    fatherName: a.fatherName,
    placeOfBirth: a.placeOfBirth,
    dateOfBirth: a.dateOfBirth,
    religion: a.religion,
    nationality: a.nationality,
    gender: a.gender,
    cnic: a.cnic,
    maritalStatus: a.maritalStatus,
    districtOfDomicile: a.districtOfDomicile,
    whatsapp: a.whatsapp,
    guardianMobile: a.guardianMobile,
    mailingAddress: a.mailingAddress,
    universityStatus: a.universityStatus,
    universityName: a.universityName,
    obtainedMarks: a.obtainedMarks !== undefined ? String(a.obtainedMarks) : "",
    totalMarks: a.totalMarks !== undefined ? String(a.totalMarks) : "",
    preference1: a.preference1,
    preference2: a.preference2,
    preference3: a.preference3,
    preference4: a.preference4,
    assignedRotation: a.assignedRotation ?? "",
  };
}

function DetailDrawer({
  app,
  onClose,
  onChanged,
  onDeleted,
}: {
  app: Application;
  onClose: () => void;
  onChanged: (a: Application) => void;
  onDeleted: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>(() => toForm(app));
  const [quickAssign, setQuickAssign] = useState(app.assignedRotation ?? "");

  function startEdit() {
    setForm(toForm(app));
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setError(null);
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) {
        const issues =
          j.issues && Object.values(j.issues).flat().join("; ");
        setError(issues || j.error || "Could not save changes.");
        return;
      }
      if (j.application) {
        onChanged(j.application);
        setQuickAssign(j.application.assignedRotation ?? "");
      }
      setEditing(false);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAssigned() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedRotation: quickAssign }),
      });
      const j = await res.json();
      if (j.application) onChanged(j.application);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete the application from ${app.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, { method: "DELETE" });
      if (res.ok) onDeleted(app.id);
    } finally {
      setDeleting(false);
    }
  }

  const rows: [string, string][] = [
    ["name", app.name],
    ["fatherName", app.fatherName],
    ["placeOfBirth", app.placeOfBirth],
    ["dateOfBirth", app.dateOfBirth],
    ["religion", app.religion],
    ["nationality", app.nationality],
    ["gender", app.gender],
    ["cnic", app.cnic],
    ["maritalStatus", app.maritalStatus],
    ["districtOfDomicile", app.districtOfDomicile],
    ["whatsapp", app.whatsapp],
    ["guardianMobile", app.guardianMobile],
    ["mailingAddress", app.mailingAddress],
    ["universityStatus", app.universityStatus],
    ["universityName", app.universityName],
    ["obtainedMarks", app.obtainedMarks !== undefined ? String(app.obtainedMarks) : ""],
    ["totalMarks", app.totalMarks !== undefined ? String(app.totalMarks) : ""],
    ["preference1", app.preference1],
    ["preference2", app.preference2],
    ["preference3", app.preference3],
    ["preference4", app.preference4],
  ];

  // Functional update helper. Using functions (not nested components) so React
  // reuses the same DOM nodes and input focus is preserved between keystrokes.
  const upd = <K extends keyof EditForm>(k: K, v: EditForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const txt = (
    label: string,
    k: keyof EditForm,
    opts?: { maxLength?: number; type?: string }
  ) => (
    <div key={k}>
      <label className="field-label" htmlFor={`f-${k}`}>
        {label}
      </label>
      <input
        id={`f-${k}`}
        type={opts?.type || "text"}
        maxLength={opts?.maxLength}
        className="field-input"
        value={form[k] as string}
        onChange={(e) => upd(k, e.target.value as EditForm[typeof k])}
      />
    </div>
  );

  const sel = (
    label: string,
    k: keyof EditForm,
    options: readonly string[]
  ) => (
    <div key={k}>
      <label className="field-label" htmlFor={`f-${k}`}>
        {label}
      </label>
      <select
        id={`f-${k}`}
        className="field-input"
        value={form[k] as string}
        onChange={(e) => upd(k, e.target.value as EditForm[typeof k])}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {editing ? "Edit application" : "Application details"}
          </h2>
          <div className="flex items-center gap-2">
            {editing ? (
              <button
                onClick={cancelEdit}
                className="rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-brand-600 hover:bg-brand-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
            <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
              Reference ID
            </div>
            <div className="font-mono text-lg font-bold tracking-wider text-brand-700">
              {referenceIdFor(app)}
            </div>
          </div>

          {app.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={app.photoUrl}
              alt={app.name}
              className="h-32 w-28 rounded-lg object-cover ring-1 ring-slate-200"
            />
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {editing ? (
            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              {txt("Name", "name")}
              {txt("Father Name", "fatherName")}
              {txt("Place of Birth", "placeOfBirth")}
              {txt("Date of Birth", "dateOfBirth", { type: "date" })}
              {txt("Religion", "religion")}
              {txt("Nationality", "nationality")}
              {sel("Gender", "gender", GENDERS)}
              {txt("CNIC / Passport", "cnic", { maxLength: 18 })}
              {sel("Marital Status", "maritalStatus", MARITAL_STATUSES)}
              {txt("District of Domicile", "districtOfDomicile")}
              {txt("WhatsApp", "whatsapp", { maxLength: 15 })}
              {txt("Guardian Mobile", "guardianMobile", { maxLength: 15 })}
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="f-mailingAddress">
                  Mailing Address
                </label>
                <textarea
                  id="f-mailingAddress"
                  rows={2}
                  className="field-input"
                  value={form.mailingAddress}
                  onChange={(e) => upd("mailingAddress", e.target.value)}
                />
              </div>
              {sel("University Status", "universityStatus", UNIVERSITY_STATUSES)}
              {txt("University Name", "universityName")}
              {txt("Obtained Marks", "obtainedMarks")}
              {txt("Total Marks", "totalMarks")}
              {sel("Preference 1", "preference1", ROTATIONS)}
              {sel("Preference 2", "preference2", ROTATIONS)}
              {sel("Preference 3", "preference3", ROTATIONS)}
              {sel("Preference 4", "preference4", ROTATIONS)}
              {sel("Assigned Rotation", "assignedRotation", ROTATIONS)}
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {LABELS[key] ?? key}
                  </dt>
                  <dd className="text-sm text-slate-800">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          )}

          {editing ? (
            <button onClick={saveEdit} className="btn btn-primary w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          ) : (
            <>
              <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <label className="field-label" htmlFor="assigned">
                  Assign rotation
                </label>
                <div className="flex gap-2">
                  <select
                    id="assigned"
                    className="field-input"
                    value={quickAssign}
                    onChange={(e) => setQuickAssign(e.target.value)}
                  >
                    <option value="">— Not assigned —</option>
                    {ROTATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-primary shrink-0" onClick={saveAssigned} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                  </button>
                </div>
              </div>
              <button onClick={remove} className="btn btn-danger w-full" disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete application
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

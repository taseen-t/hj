# House Job Application Portal

A Next.js application that replaces the old single-page HTML form for the
**House Job — Annual Session 2026-2027, Allied Hospital-I / II & FTH, Faisalabad**.

It provides:

- A polished, validated **application form** with photo upload.
- A **PDF download** of the applicant's own filled form (generated in-browser).
- A passcode-protected **admin panel** to view every submission, assign
  rotations, and **export all data to Excel (.xlsx)**.
- A pluggable data layer: runs on **local JSON storage** out of the box, and
  switches to **Supabase (Postgres + Storage)** as soon as you add keys.

---

## Quick start (no setup needed)

```bash
npm install
cp .env.local.example .env.local
# then set ADMIN_PASSCODE in .env.local — the admin panel needs it
npm run dev
```

- Form:  http://localhost:3000
- Admin: http://localhost:3000/admin

In this mode every submission is saved to `./.data/applications.json` and the
photo is stored inline. Great for trying it locally.

> **`ADMIN_PASSCODE` is required and has no default.** If it is unset, the admin
> panel rejects every login and logs a warning, rather than falling back to a
> guessable password. The public application form keeps working either way.

---

## Switching to Supabase

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql)
   (creates the `applications` table and the `application-photos` bucket).
3. In **Project Settings -> API**, copy the **Project URL** and the
   **`service_role`** key.
4. Put them in `.env.local`:

   ```bash
   SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...        # service_role (keep secret!)
   SUPABASE_PHOTO_BUCKET=application-photos
   ADMIN_PASSCODE=choose-a-strong-passcode
   ```

5. Restart `npm run dev`. The admin panel header will now read **"Supabase"**.

> The `service_role` key is powerful and used **only on the server**. It is
> never shipped to the browser. Never commit `.env.local`.

---

## How it works

| Area            | Detail                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Form validation | `react-hook-form` + `zod` (client) and re-validated on the server.    |
| User PDF        | `jsPDF`, generated entirely in the browser — applicant data is private.|
| Admin auth      | Shared passcode -> hashed into an httpOnly cookie. All applicant data |
|                 | is served only through server routes, never exposed to the public.    |
| Excel export    | `exceljs`, generated server-side at `/api/admin/export`.              |
| Storage         | `src/lib/db.ts` — `LocalStore` (JSON) or `SupabaseStore`, auto-chosen.|

### Editing the rotation list

The list of rotations applicants can choose (and that admins assign) lives in
one place: `ROTATIONS` in [`src/lib/types.ts`](src/lib/types.ts). Edit it there.

---

## Project structure

```
src/
  app/
    page.tsx                 # public application form
    admin/page.tsx           # admin panel
    api/
      submit/                # POST a new application
      admin/                 # login / logout / me / applications / export
  components/
    ApplicationForm.tsx      # the form + success screen + PDF button
    AdminPanel.tsx           # passcode gate, table, detail drawer
    fields.tsx               # small form field helpers
  lib/
    types.ts                 # zod schema, option lists, labels
    db.ts                    # storage abstraction (local + supabase)
    supabase.ts              # server-side supabase client
    auth.ts                  # passcode cookie helpers
    excel.ts                 # xlsx builder
    pdf.ts                   # browser PDF builder
supabase/schema.sql          # table + storage bucket
```

## Production build

```bash
npm run build
npm run start
```

For deployment (e.g. Vercel) use **Supabase mode** — the local JSON store is
for development only and won't persist on serverless hosts.

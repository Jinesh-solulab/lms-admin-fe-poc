# LMS Admin (POC)

Admin web panel for the HungerStation rider LMS POC. Talks to `../lms-backend`.

Stack: React 18 + Vite 5 + TypeScript + Ant Design 5. UI in English, Arabic and Urdu (Arabic and Urdu are RTL).

## Run

```
cp .env.example .env       # set VITE_API_URL if the API is not on localhost:3000
npm install
npm run dev                # http://localhost:5173
```

Start the backend first (`cd ../lms-backend && npm run start:dev`), and seed it once (`npm run seed`).
Demo admin: `admin@hungerstation.local` / `Admin@123`.

Other scripts: `npm run typecheck`, `npm run build` (type-check + production build to `dist/`), `npm run preview`.

## Screens

| Route | What it does | API |
|---|---|---|
| `/login` | Email + password | `POST /auth/admin/login` |
| `/dashboard` | Riders, blocked, completion bar, by module, by city, auto-refresh 15s, "Run deadline check" | `/admin/dashboard/summary`, `/by-city`, `/admin/modules`, `POST /admin/jobs/deadline-check` |
| `/modules` | Module list + create | `GET/POST /admin/modules` |
| `/modules/:id?tab=details` | Edit title/description (ar + en), deadline days, video %, active | `PATCH /admin/modules/:id` |
| `?tab=content` | Upload / replace video and PDF with progress | `POST /admin/modules/:id/video`, `/pdf` |
| `?tab=quiz` | Question editor (ar + en), correct option, pass mark | `PUT /admin/modules/:id/quiz` |
| `?tab=assign` | Assign by city / specific riders / all; default, exact or "minutes from now" deadline | `POST /admin/modules/:id/assign` |
| `?tab=progress` | Module stats + per-rider progress | `/admin/dashboard/modules/:id`, `/riders` |
| `/riders` | Search, filter (blocked / city), add rider | `GET/POST /admin/riders` |
| `/riders/:id` | Profile edit, assignments with progress, block / unblock (+ new deadline), history | `/admin/riders/:id`, `/block`, `/unblock` |
| `/block-logs` | All block / unblock / overdue events | `GET /admin/block-logs` |

## Structure

```
src/
  api/          client.ts (fetch + upload with progress), index.ts (one function per endpoint), types.ts
  i18n.tsx      en/ar UI strings, RTL switch, pick() for { en, ar } content
  auth.tsx      session (token in localStorage), 401 -> login
  components/   AppLayout, LocalizedFields (en + ar inputs), Status tags, StatusBar
  pages/        one file per screen; pages/module/* are the module detail tabs
```

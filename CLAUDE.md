# LMS Admin frontend – POC (Solulab bid for HungerStation)

Admin web panel for `../lms-backend` (NestJS + MongoDB). Read `../lms-backend/CLAUDE.md` for the client context, scope and the API rules.

## Stack
- React 18 + Vite 5 + TypeScript (strict) + Ant Design 5 + react-router 6 + dayjs. No state library: `hooks/useAsync.ts` + local state.
- API base URL from `VITE_API_URL` in `.env` (gitignored; `.env.example` is committed).

## Conventions
- All API calls go through `src/api/index.ts` (one function per endpoint). Responses are `{ success, message, data }`; `call()` returns `{ data, message }` and the backend `message` is already localized, so show it in toasts.
- Every ID is a MongoDB ObjectId string. Never UUIDs.
- Languages: English, Arabic, Urdu (`en | ar | ur`). UI text: `t('key')` from `src/i18n.tsx`. Every key must exist in `en`, `ar` and `ur` (`ar`/`ur` are typed `Record<TKey, string>`, so a missing key fails `tsc`). Content `{ en, ar, ur }` is shown with `pick()` (fallback English, then Arabic — same as the backend `loc()`).
- Content forms: English + Arabic required, Urdu optional (`components/LocalizedFields.tsx`).
- Arabic and Urdu = RTL (`isRtl()`): antd `ConfigProvider direction` + `<html dir>`. Use logical CSS (`inset-inline-*`, `margin-inline-*`), never left/right.
- Arabic/Urdu text inputs get `dir="rtl"`; phone numbers get `dir="ltr"`.
- Status colors (good / critical) are only for state, always with an icon + label (see `components/Status.tsx`).

## Working preferences (user)
- **Do not run `npm install`.** Add dependencies to `package.json`; the user installs them.
- Wants fast execution: build directly, minimal back-and-forth.

## Status (2026-11-12)
- All admin screens are written: login, dashboard, modules (details / content / quiz / assign / progress), riders, rider detail (block / unblock), block log.
- Not yet type-checked or run (dependencies not installed when it was written). First step next time: `npm install && npm run typecheck`, then fix anything it reports.

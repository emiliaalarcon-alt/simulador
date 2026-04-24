# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is a **Simulador PAES** app — a Chilean university entrance exam simulator with a public student-facing simulator and a protected admin panel.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Wouter routing, Framer Motion, shadcn/ui, Tailwind v4

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` — Express API server (port 8080, path /api)
- `artifacts/simulador-paes` — React + Vite frontend (path /)
- `artifacts/mockup-sandbox` — Component preview server

## Application Architecture

### Public Simulator (`/`)
- 3-step flow: Enter scores → Filter options → Results
- Score sliders for CL, M1, M2 (optional), CS (optional), HI (optional), NEM, Ranking
- Results show weighted puntaje calculado vs corte 2024 with color-coded cards + motivational messages
- Green (>50 pts above cutoff), Yellow (0-50 above), Orange (0-50 below), Red (>50 below)

### Admin Panel (`/admin`)
- Login with JWT (default password: `paes2025admin`, set `ADMIN_PASSWORD` env var to change)
- Dashboard: stats, careers per area chart, recent careers, publish button
- Carreras: CRUD table with search + pagination
- Upload PDF: base64 upload → pdftotext extraction → auto-import careers
- Settings: toggle simulator active, set year, set welcome message

## API Routes
- `POST /api/auth/login` — admin login
- `GET /api/carreras` — public career list (published only, filterable)
- `GET /api/carreras/filters` — regions/universities/areas for dropdowns
- `GET /api/carreras/stats` — aggregate stats
- `GET /api/carreras/:id` — single career
- `GET/POST /api/admin/carreras` — admin career CRUD
- `PUT/DELETE /api/admin/carreras/:id`
- `POST /api/admin/publish` — publish all drafts
- `POST /api/admin/upload-pdf` — parse PDF and import careers
- `GET/PATCH /api/admin/settings` — simulator settings (admin)
- `GET /api/settings/public` — public-facing settings (orientadora message, mensaje bienvenida)

## Database Schema
- `carreras` table: career info with ponderaciones (CL/M1/M2/CS/HI/NEM/Ranking), puntajeCorte, publicado
- `settings` table: simuladorActivo, anoProcesoActual, mensajeBienvenida, orientadoraEnabled, orientadoraTitulo, orientadoraMensaje, orientadoraCtaTexto, orientadoraCtaUrl (CTA URL is allowlisted to http/https/mailto/tel both server-side and client-side to prevent javascript:/data: XSS)
- 20 seed careers pre-loaded

## Auth
- JWT stored in `localStorage` as `paes_admin_token`
- Token getter registered via `setAuthTokenGetter` in `auth.ts`
- `SESSION_SECRET` env var used for JWT signing

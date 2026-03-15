# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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
- **Frontend**: React + Vite + TailwindCSS + D3.js + Framer Motion
- **AI Integration**: OpenAI via Replit AI Integrations (for data generation)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── india-jobs/         # React+Vite frontend (AI Exposure dashboard)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations/       # AI integration libraries
│       └── openai-ai-server/ # OpenAI integration for server-side use
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## Application: AI Exposure of the Indian Job Market

A full-stack web app visualizing how susceptible ~142 Indian occupations are to AI automation, inspired by karpathy.ai/jobs but focused on the Indian economy using PLFS/NCO 2015 data.

### Features
- **Interactive D3 Treemap**: Area = number of workers, color = AI exposure score (green=low, red=high)
- **Exposure vs Outlook Column View**: Stacked columns by exposure score (0-10)
- **Sidebar Stats**: Total workers (76.7Cr), weighted avg exposure (2.4), breakdowns by pay/education
- **Hover Tooltips**: Occupation details with AI-generated rationale for exposure score
- **Indian Formatting**: INR currency (₹), Indian number system (lakhs/crores)
- **Dark Theme**: #111 background matching karpathy.ai/jobs design

### Data
- 142 Indian occupations across 15 categories (IT, healthcare, agriculture, manufacturing, etc.)
- ~767M total workers with realistic PLFS employment data
- AI exposure scores (0-10) with AI-generated rationale for each occupation
- Data stored as static JSON at `artifacts/api-server/src/data/occupations.json`
- Served via `GET /api/occupations` endpoint

### Key Files
- `artifacts/india-jobs/src/pages/Dashboard.tsx` - Main dashboard page
- `artifacts/india-jobs/src/components/Treemap.tsx` - D3 treemap visualization
- `artifacts/india-jobs/src/components/Columns.tsx` - Column/bar chart view
- `artifacts/india-jobs/src/components/Sidebar.tsx` - Stats sidebar
- `artifacts/india-jobs/src/components/Tooltip.tsx` - Hover tooltip
- `artifacts/india-jobs/src/lib/utils.ts` - Formatting utilities (INR, crores/lakhs, exposure colors)
- `artifacts/api-server/src/routes/occupations.ts` - API route serving occupation data
- `artifacts/api-server/src/data/occupations.json` - 142 occupations dataset

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`); `src/routes/occupations.ts` exposes `GET /occupations` (full path: `/api/occupations`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `artifacts/india-jobs` (`@workspace/india-jobs`)

React + Vite frontend for the AI Exposure dashboard. Uses D3.js for treemap visualization, Framer Motion for animations, TanStack Query for data fetching.

- Entry: `src/main.tsx` — React app root
- Pages: `src/pages/Dashboard.tsx` — main dashboard with treemap/columns views
- Components: Treemap, Columns, Sidebar, Tooltip
- Hooks: `src/hooks/use-occupations.ts` — fetches occupation data from API
- Depends on: `@workspace/api-client-react`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`, `GetOccupationsResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

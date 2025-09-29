# AI Firewall Automation Platform

A modern, AI-assisted firewall management dashboard built with Next.js App Router and shadcn/ui. It provides policy generation/validation, simulation, compliance views, monitoring dashboards, and an AI assistant powered by Genkit and Google AI models.

## Key Features

- Policy lifecycle: create, approve/reject, deploy, rollback snapshots
- AI policy generator: natural language to structured firewall rules
- Policy validation: best-practice checks and conflict detection
- Policy simulation: dry-run traffic flows against a policy set
- AI tools: self-healing checks, anomaly detection (UBA), model management
- Threat intel: CVEs, MITRE ATT&CK, and IoC views
- Compliance: framework coverage (PCI DSS, HIPAA, GDPR, ISO 27001)
- Monitoring: traffic, threats, latency, packet loss charts
- Nice UX: dark mode, responsive layout, keyboard-accessible UI

## Tech Stack

- Next.js 15 (App Router) — `src/app/`
- TypeScript — strict mode, bundler module resolution
- Tailwind CSS + shadcn/ui — UI components in `src/components/ui/`
- Genkit + Google AI — AI flows under `src/ai/`
- Recharts — charts in monitoring pages
- Zod — form data validation in server actions

See `package.json` for exact versions and scripts.

## Architecture Overview

- App shell: `src/app/layout.tsx` wraps pages in `ThemeProvider`, `SidebarProvider`, and the shared `AppLayout`.
- Routing: app router directories under `src/app/<route>/page.tsx`.
- Server Actions: defined in `src/app/actions.ts` for policy CRUD, validation, simulation, AI tools, etc.
- AI Flows: Genkit flows live in `src/ai/flows/*.ts` and are wired via `src/ai/dev.ts` and `src/ai/genkit.ts`.
- UI Composition: shared building blocks in `src/components/` and shadcn/ui primitives in `src/components/ui/`.
- Mock Data Store: in-memory data and helpers in `src/lib/data.ts` (no database yet).

## Directory Structure

```
./
├─ src/
│  ├─ ai/
│  │  ├─ dev.ts                # Loads all flows for local Genkit dev server
│  │  ├─ genkit.ts             # Genkit configuration (Google AI plugin, model)
│  │  └─ flows/                # AI features implemented as flows
│  │     ├─ generate-firewall-policy.ts
│  │     ├─ validate-firewall-policy.ts
│  │     ├─ simulate-policy.ts
│  │     ├─ self-healing-misconfigurations.ts
│  │     ├─ detect-admin-anomalies.ts
│  │     ├─ summarize-security-events.ts
│  │     ├─ emulate-adversary.ts
│  │     ├─ create-incident.ts
│  │     └─ ai-manage-retrain-evaluate-version.ts
│  ├─ app/
│  │  ├─ layout.tsx            # Global layout, theme & sidebar providers
│  │  ├─ page.tsx              # Dashboard landing page
│  │  ├─ actions.ts            # Server actions for forms and AI calls
│  │  ├─ ai-tools/page.tsx     # Tabbed AI tools suite
│  │  ├─ policies/page.tsx     # Policy table, CRUD & deploy actions
│  │  ├─ network-objects/page.tsx
│  │  ├─ monitoring/page.tsx
│  │  ├─ compliance/page.tsx
│  │  ├─ threat-intelligence/page.tsx
│  │  └─ ... other feature pages (reports, response, automations, etc.)
│  ├─ components/
│  │  ├─ layout.tsx, header.tsx, sidebar-nav.tsx
│  │  ├─ dashboard/, policies/, ai-tools/, configuration/, ...
│  │  └─ ui/                   # shadcn/ui primitives and wrappers
│  ├─ hooks/                   # `use-toast`, `use-mobile`
│  └─ lib/
│     ├─ data.ts               # In-memory data and helpers
│     ├─ utils.ts              # Utility helpers (e.g., `cn`)
│     └─ placeholder-images.*  # Static seed data
├─ docs/
│  ├─ blueprint.md             # Product blueprint and style guidelines
│  └─ README.md                # This file
├─ tailwind.config.ts          # Tailwind theme, tokens, and plugins
├─ components.json             # shadcn/ui config & path aliases
├─ next.config.ts              # Next.js config (ESLint/TS build settings, images)
├─ tsconfig.json               # TS config with `@/*` path alias to `src/*`
├─ apphosting.yaml             # Firebase App Hosting config (instances)
├─ package.json                # Dependencies and scripts
└─ README.md                   # Minimal root readme (link here if desired)
```

## Environment Setup

1) Prerequisites

- Node.js 18.17+ or 20+ LTS
- npm (bundled with Node) or pnpm/yarn
- A Google AI API key for Genkit’s `@genkit-ai/googleai` plugin

2) Clone & install

```
npm install
```

3) Configure environment variables

Create a `.env` in the project root:

```
# Google AI key for Genkit GoogleAI plugin
# Choose the correct variable name per your account/setup and Genkit plugin docs
GOOGLE_GENAI_API_KEY=your_api_key_here
# or
GOOGLE_API_KEY=your_api_key_here
```

Notes:
- `src/ai/dev.ts` loads `.env` via `dotenv` in the Genkit dev process.
- Do not commit `.env` files to version control.

## Running the App (Local)

Use two terminals:

Terminal A — Next.js web app (port 9002)
```
npm run dev
```

Terminal B — Genkit dev server for AI flows
```
# One-off run
npm run genkit:dev

# Or watch mode (auto-reload on code changes)
npm run genkit:watch
```

Available scripts (from `package.json`):
- `dev`: Next dev with Turbopack on port 9002
- `build`: Next build
- `start`: Next start (after build)
- `lint`: next lint
- `typecheck`: `tsc --noEmit`
- `genkit:dev`: `genkit start -- tsx src/ai/dev.ts`
- `genkit:watch`: `genkit start -- tsx --watch src/ai/dev.ts`

## Configuration Highlights

- `next.config.ts`
  - Ignores TS and ESLint build errors to ease iteration
  - Remote image patterns for placeholder/demo images
- `tailwind.config.ts`
  - Dark mode via `class`
  - Design tokens via CSS variables (background, foreground, chart, sidebar, etc.)
  - Inter font families
  - `tailwindcss-animate` plugin
- `components.json`
  - shadcn/ui configuration and path aliases (`@/components`, `@/lib`, `@/hooks`, etc.)
- `tsconfig.json`
  - `@/*` alias maps to `src/*`

## Routes and Screens

- `/` — Dashboard overview (`src/app/page.tsx`)
- `/policies` — Policies list with CRUD and deploy (`src/app/policies/page.tsx`)
- `/ai-tools` — AI tools suite (generator, validation, simulation, UBA, model mgmt)
- `/network-objects` — Address/service objects and groups
- `/monitoring` — Traffic, threats, latency, packet loss charts
- `/compliance` — Framework coverage and drill-down to controls
- `/threat-intelligence` — CVEs, MITRE ATT&CK, and IoCs
- Additional stubs: `/configuration`, `/reports`, `/automations`, `/response`, `/settings`, `/support`, `/templates`

## AI Flows (Genkit)

- Configuration: `src/ai/genkit.ts`
  - Default model: `googleai/gemini-2.5-flash`
- Dev bootstrap: `src/ai/dev.ts` (imports all flows)
- Flows (selected):
  - `generate-firewall-policy.ts`: NL prompt -> structured policy
  - `validate-firewall-policy.ts`: checks & conflict detection
  - `simulate-policy.ts`: dry-run traffic flow against policy set
  - `self-healing-misconfigurations.ts`: guardrail-based diagnostics/fixes
  - `detect-admin-anomalies.ts`: UBA of admin actions/access patterns
  - `emulate-adversary.ts`: simulate MITRE ATT&CK techniques
  - `create-incident.ts`: open incidents/cases from events

Server actions in `src/app/actions.ts` wire UI forms to these flows using Zod for validation.

## Data & State

- In-memory data only, via `src/lib/data.ts` (policies, snapshots, devices, compliance, objects)
- No database or API persistence yet; page reloads reset data to seeds

## Deployment

This project is set up for Firebase App Hosting.

- Config: `apphosting.yaml` (e.g., `runConfig.maxInstances`)
- High-level steps:
  1. Create a Firebase project and enable App Hosting
  2. Configure environment variables (Google AI key) in Firebase
  3. Build the app: `npm run build`
  4. Deploy via Firebase console (recommended for App Hosting) or integrate CI/CD

Refer to Firebase App Hosting docs for the latest CLI/Console deployment flow: https://firebase.google.com/docs/app-hosting

## Quality & Tooling

- Type checking: `npm run typecheck`
- Linting: `npm run lint`
- Build: `npm run build`

## Contributing

- Open an issue or PR describing the change
- Keep UI consistent with shadcn/ui patterns and Tailwind tokens
- Add or adjust server actions and flows with Zod validation

## Security Notes

- Do not commit secrets; use environment variables
- Review AI prompts/outputs for safety and guardrails before production
- Add auth/RBAC and audit logs before exposing externally

## License

Provide a license here (e.g., Apache-2.0, MIT). If omitted, the project is proprietary by default.

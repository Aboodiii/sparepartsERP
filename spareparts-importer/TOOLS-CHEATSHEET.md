# Full-Stack Tools Cheat-Sheet (revision reference)

A map of what's out there so you can pick the right tool as projects grow.
This starter uses the **bold** rows.

---

## Frontend admin templates / UI kits

You asked about Metronic "or any other". Here's the honest landscape.

### Paid, all-in-one admin themes
| Tool          | Built on        | Notes |
|---------------|-----------------|-------|
| **Metronic**  | Bootstrap + React/Vue/Angular/HTML | Huge, polished, lots of demos. One-time fee. Great if you want everything pre-designed and don't mind the weight. |
| Vuexy         | Bootstrap/Vuetify | Popular Vue/React premium theme. |
| Materio / Sneat | MUI / Bootstrap | Clean premium MUI themes (free "lite" versions exist). |

Paid themes save design time but are **big** and can be hard to learn from —
you spend time learning *their* conventions, not the framework's.

### Free / open-source admin templates  ← you chose this lane
| Tool                | Built on            | Best for |
|---------------------|---------------------|----------|
| **Ant Design (antd)** | React               | Enterprise back-offices. Tables, forms, layout all included. **(used here)** |
| Ant Design Pro      | React + antd        | A full admin scaffold on top of antd (auth, layouts, mock data). |
| Refine              | React (+ antd/MUI)  | **Auto-generates CRUD** from your API. Huge time-saver once you know the basics. Best "next step" from this project. |
| MUI (Material UI)   | React               | Google Material look; massive ecosystem. |
| Mantine             | React               | Modern, great DX, lots of hooks + components. |
| shadcn/ui           | React + Tailwind    | Copy-paste components you own and restyle. Trendy, very flexible. |
| Tabler              | Bootstrap 5         | Beautiful free HTML/React admin. Framework-light. |
| CoreUI              | Bootstrap (React/Vue/Angular) | Classic free admin, paid Pro tier. |
| AdminLTE           | Bootstrap (jQuery)  | The old reliable. Dated, but everywhere. |
| Vuetify / Element+  | Vue                 | If you go Vue instead of React. |

**Rule of thumb:** antd or MUI for serious back-offices; Mantine or shadcn/ui
if you want more control over the look; **Refine** when you're tired of writing
the same CRUD by hand; Metronic/Tabler if you want a ready-made theme.

---

## Backend frameworks (Node.js)

| Tool         | Notes |
|--------------|-------|
| **Express**  | Minimal, the classic. Easiest to learn, you wire things yourself. **(used here)** |
| NestJS       | Structured, opinionated (modules, DI, decorators). Feels like ASP.NET — natural next step for you. |
| Fastify      | Like Express but faster, schema-based validation. |
| Hono         | Tiny, modern, runs anywhere (edge, serverless). |

(If you ever want familiar ground: **ASP.NET Core Web API** in C# does exactly
what this Express backend does.)

---

## Database + ORM

| Tool          | Notes |
|---------------|-------|
| **SQLite**    | A file. Zero setup. Perfect for learning/prototyping. **(used here)** |
| PostgreSQL    | The default "real" choice for production. |
| MySQL / MariaDB | Also common; widely hosted. |
| SQL Server    | You already know it — Prisma supports it too. |
| **Prisma (ORM)** | Type-safe, schema-first, great migrations + Studio GUI. **(used here)** |
| Drizzle       | Lighter, SQL-like alternative ORM gaining popularity. |
| Knex          | Query builder, closer to raw SQL. |

An **ORM** lets you switch databases by changing one config line — you write the
same code against SQLite today and PostgreSQL in production.

---

## Glue you'll meet next

| Need               | Reach for |
|--------------------|-----------|
| API calls (frontend) | **axios** (used here) or `fetch`; TanStack Query for caching |
| Auth               | JWT + bcrypt; or Auth0 / Clerk / Supabase Auth |
| Forms + validation | antd Form (used here); React Hook Form + Zod |
| Charts             | Recharts, Chart.js, ECharts |
| Hosting (frontend) | Vercel, Netlify |
| Hosting (backend)  | Render, Railway, Fly.io; or a VPS |
| Containerising     | Docker (one image each for API + DB) |

---

## A sensible "grow-up" path for this project

1. **Now:** Express + Prisma + SQLite + React + antd  ← you are here
2. **Add structure:** move to NestJS, add JWT auth, switch to PostgreSQL
3. **Speed up the UI:** adopt Refine to auto-build CRUD screens
4. **Ship it:** Docker + Render/Railway (API+DB) and Vercel (frontend)

You don't need any of step 2–4 to learn the fundamentals. Master the CRUD loop
in step 1 first — everything else is a variation on it.

# Spare Parts Importer — Full-Stack Starter

A deliberately **simple, generic back-office** for a car spare-parts importer
(catalogue, suppliers, customers, dashboard). Built to **learn a modern code
stack** and to keep as a **reference** you can come back to.

- **Backend:** Node.js + Express + Prisma + SQLite (a REST API)
- **Frontend:** React + Vite + Ant Design (a free, MIT-licensed admin UI)
- **Database:** SQLite (one file, no install) — easy to swap for PostgreSQL later

```
spareparts-importer/
├── backend/      Express REST API
│   ├── prisma/   schema.prisma (your tables) + seed.js (sample data)
│   └── src/      server.js, routes/, prisma client
└── frontend/     React admin (sidebar + tables + forms)
    └── src/      layout/, pages/, api/
```

---

## Prerequisites

Install **Node.js 18 or newer** (`node -v` to check). That's it — SQLite needs
no separate install.

---

## 1) Run the backend

```bash
cd backend
cp .env.example .env        # Windows: copy .env.example .env
npm install
npm run setup               # creates the DB tables and loads sample data
npm run dev                 # starts the API on http://localhost:4000
```

Check it works: open <http://localhost:4000/api/health> — you should see
`{"status":"ok"}`.

Handy backend commands:

| Command            | What it does                                  |
|--------------------|-----------------------------------------------|
| `npm run dev`      | Start API with auto-reload (nodemon)          |
| `npm run db:push`  | Apply schema changes to the database          |
| `npm run db:seed`  | Reset + reload sample data                     |
| `npm run db:studio`| Open Prisma Studio — a GUI to browse your data |

## 2) Run the frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev                 # opens http://localhost:5173
```

Open <http://localhost:5173>. Keep **both** terminals running.

---

## How a request flows (the mental model)

```
React page  --axios-->  Express route  --Prisma-->  SQLite
 (Parts.jsx)            (routes/parts.js)            (dev.db)
     ^                                                   |
     +---------------- JSON response --------------------+
```

Every screen is the same **CRUD loop**: load a list into a table → add/edit in a
modal form → save (POST/PUT) → reload. Read `frontend/src/pages/Parts.jsx`
first — it's the fully-commented reference; the other pages repeat the pattern.

---

## Where to learn each "new thing"

| You're touching…        | The concept to look up          |
|-------------------------|---------------------------------|
| `schema.prisma`         | Data modelling, relations, ORMs |
| `routes/*.js`           | REST APIs, HTTP verbs, Express  |
| `prisma.js` / queries   | Prisma Client, async/await      |
| `pages/*.jsx`           | React hooks (`useState`, `useEffect`) |
| `api/client.js`         | Fetching data with axios        |
| `layout/AppLayout.jsx`  | React Router, app layout        |

---

## Extend it (good next exercises)

1. **Add a Sales / Orders module** — an order has a customer and many line
   items. This teaches one-to-many relations and reducing stock on sale.
2. **Search & filter** the parts table (Ant Design `Table` supports it).
3. **Login** — add a `User` model and JWT auth on the API.
4. **Swap SQLite → PostgreSQL** — change one line in `schema.prisma`, set a new
   `DATABASE_URL`, re-run `db:push`. Nothing else changes (that's the point of
   an ORM).

See `TOOLS-CHEATSHEET.md` for the wider tool landscape (Metronic vs the free
alternatives, and what to reach for as the app grows).

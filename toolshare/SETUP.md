# Running ToolShare Locally in Ghostty

## Prerequisites

- **Node.js 20+** — check with `node -v`
- **PostgreSQL 15+** — check with `psql --version`

---

## Step 1 — Start PostgreSQL

Make sure PostgreSQL is running, then create the database:

```bash
psql -U postgres -c "CREATE DATABASE toolshare;"
```

---

## Step 2 — Backend

Open a Ghostty tab (`Ctrl+Shift+T`) and run:

```bash
cd toolshare/backend
cp .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The API starts on **http://localhost:3001**.

> Edit `.env` to set your real PostgreSQL user/password in `DATABASE_URL` if they differ from the defaults.

---

## Step 3 — Frontend

Open a second Ghostty tab (`Ctrl+Shift+T`) and run:

```bash
cd toolshare/frontend
cp .env.example .env
npm install
npm run dev
```

The app opens on **http://localhost:5173**.

---

## Quick Reference

| Service  | URL                     | Ghostty Tab |
|----------|-------------------------|-------------|
| Backend  | http://localhost:3001    | Tab 1       |
| Frontend | http://localhost:5173    | Tab 2       |

To stop either server, press `Ctrl+C` in its tab.

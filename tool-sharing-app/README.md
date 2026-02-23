# Garden Tool Share

A community web app for lending and borrowing gardening tools.

## Tech stack

| Layer      | Technology                          | Why                                              |
|------------|-------------------------------------|--------------------------------------------------|
| Backend    | Node.js + Express                   | Widely known, minimal setup                      |
| Database   | SQLite (via `better-sqlite3`)        | Zero config — just a single file, plain SQL       |
| Auth       | Passport.js (local + Google OAuth)  | Industry standard, easy to extend                |
| Sessions   | `express-session` + SQLite store     | Simpler than JWT for a first app                 |
| Frontend   | React + Vite                        | Fast dev server, component model most devs know  |
| API tests  | Cucumber.js + Supertest             | BDD — features readable by non-developers        |
| E2E tests  | Cucumber.js + Playwright            | Real-browser BDD for UI flows                    |

---

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # edit SESSION_SECRET at minimum
npm run dev                 # starts on http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## Running the tests

### Backend API tests (Cucumber + Supertest)

These test every API endpoint in isolation using an in-memory database.
No servers need to be running.

```bash
cd backend
npm test
```

Run a single feature file:

```bash
cd backend
npx cucumber-js features/auth.feature
```

### Frontend E2E tests (Cucumber + Playwright)

These drive a real Chromium browser against the running app.
Both servers must be running first.

```bash
cd frontend
npx playwright install chromium   # first time only
npm run test:e2e
```

---

## Database schema

Three tables, all in `backend/data/app.db`:

```
users
  id, name, email, password_hash, auth_provider, provider_id, avatar_url, created_at

tools
  id, owner_id → users.id, name, description, category, condition, available, created_at

tool_requests
  id, tool_id → tools.id, requester_id → users.id, status, message, created_at, updated_at
```

`available` is automatically toggled:
- Set to `0` when a request is **approved**
- Set back to `1` when a request is **returned** or **rejected**

---

## API reference

### Auth
| Method | Path                    | Auth? | Description                 |
|--------|-------------------------|-------|-----------------------------|
| POST   | /auth/register          | —     | Create account               |
| POST   | /auth/login             | —     | Log in (email + password)    |
| POST   | /auth/logout            | —     | End session                  |
| GET    | /auth/me                | —     | Current user (or 401)        |
| GET    | /auth/google            | —     | Start Google OAuth flow      |
| GET    | /auth/google/callback   | —     | Google OAuth callback        |

### Tools
| Method | Path          | Auth?  | Description                   |
|--------|---------------|--------|-------------------------------|
| GET    | /tools        | —      | List all available tools      |
| GET    | /tools/mine   | ✓      | List my tools                 |
| GET    | /tools/:id    | —      | Get one tool                  |
| POST   | /tools        | ✓      | Add a tool                    |
| PUT    | /tools/:id    | ✓      | Update my tool                |
| DELETE | /tools/:id    | ✓      | Delete my tool                |

### Requests
| Method | Path                      | Auth? | Description                     |
|--------|---------------------------|-------|---------------------------------|
| GET    | /requests/mine            | ✓     | My outgoing requests            |
| GET    | /requests/received        | ✓     | Incoming requests on my tools   |
| POST   | /requests/tool/:toolId    | ✓     | Request to borrow a tool        |
| PUT    | /requests/:id             | ✓     | Update status (approve/reject/return) |

---

## Social login (Google)

1. Go to https://console.developers.google.com
2. Create a project → Enable **Google+ API**
3. Create **OAuth 2.0 credentials** (Web application)
4. Set Authorised redirect URI: `http://localhost:3001/auth/google/callback`
5. Copy the Client ID and Secret into your `.env`

Leave `GOOGLE_CLIENT_ID` blank to disable Google login entirely.

---

## Project structure

```
tool-sharing-app/
├── backend/
│   ├── src/
│   │   ├── server.js            Entry point
│   │   ├── app.js               Express app + middleware
│   │   ├── db.js                SQLite setup + schema
│   │   ├── config/passport.js   Auth strategies
│   │   ├── middleware/
│   │   │   └── requireAuth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── tools.js
│   │       └── requests.js
│   ├── features/                Gherkin feature files
│   │   ├── auth.feature
│   │   ├── tools.feature
│   │   └── requests.feature
│   ├── step_definitions/        Cucumber step implementations
│   │   ├── auth.steps.js
│   │   ├── tools.steps.js
│   │   └── requests.steps.js
│   ├── support/world.js         Test world + fixture helpers
│   ├── cucumber.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── api.js               All API calls in one place
    │   ├── index.css
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ToolCard.jsx
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Login.jsx
    │       ├── Register.jsx
    │       ├── Tools.jsx
    │       ├── MyTools.jsx
    │       ├── AddTool.jsx
    │       └── Requests.jsx
    ├── e2e/
    │   ├── features/            E2E Gherkin feature files
    │   │   ├── browsing.feature
    │   │   └── auth_ui.feature
    │   └── step_definitions/
    │       └── steps.js
    ├── index.html
    ├── vite.config.js
    ├── cucumber.js
    └── package.json
```

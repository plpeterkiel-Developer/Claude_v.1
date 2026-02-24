# ToolShare

> Neighbour-to-neighbour gardening tool sharing — free, community-based.

ToolShare is a web application that allows neighbours in a local area to share gardening tools with one another at no cost. Built for the Danish market with full English support.

---

## Project Structure

```
toolshare/
├── backend/                  # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (PostgreSQL via Prisma)
│   │   └── seed.js           # Seed script for development data
│   ├── src/
│   │   ├── app.js            # Express app entry point
│   │   ├── config/
│   │   │   └── passport.js   # Auth strategies (Local, Google, Facebook, JWT)
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT authentication middleware
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js   # express-validator result handler
│   │   ├── routes/
│   │   │   ├── auth.js       # POST /auth/register, /login, /logout, /refresh
│   │   │   ├── tools.js      # GET|POST|PATCH|DELETE /tools
│   │   │   ├── requests.js   # POST|GET|PATCH /requests
│   │   │   ├── reviews.js    # POST /reviews, GET /reviews/user/:id
│   │   │   ├── reports.js    # POST|GET|PATCH /reports
│   │   │   └── users.js      # GET|PATCH|DELETE /users/me
│   │   └── services/
│   │       ├── email.js      # SendGrid / Resend email service
│   │       ├── imageUpload.js # Multer + Sharp image processing
│   │       ├── scheduler.js  # Cron job for overdue loan detection
│   │       └── tokens.js     # JWT sign/verify helpers
│   └── tests/
│       └── unit/             # Jest unit tests
│           ├── auth.test.js
│           ├── email.test.js
│           ├── tools.test.js
│           └── validate.test.js
│
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/client.js     # Axios instance with token refresh
│   │   ├── components/       # Shared components
│   │   │   ├── Layout/       # Navbar + Layout wrapper
│   │   │   ├── ToolCard/     # Tool listing card
│   │   │   ├── StarRating/   # Accessible star rating (read + interactive)
│   │   │   ├── BorrowModal/  # Borrow request form modal
│   │   │   └── ReportModal/  # Report content modal
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── locales/
│   │   │   ├── da.json       # Danish translations (default)
│   │   │   └── en.json       # English translations
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Browse.jsx
│   │   │   ├── ToolDetail.jsx
│   │   │   ├── AddTool.jsx   # Also handles edit mode
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── VerifyEmail.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── LeaveReview.jsx
│   │   │   ├── AccountSettings.jsx
│   │   │   └── NotFound.jsx
│   │   ├── styles/global.css # WCAG 2.1 AA compliant styles
│   │   ├── App.jsx           # Routes
│   │   ├── i18n.js           # i18next configuration
│   │   └── main.jsx
│   └── public/
│
├── features/                 # Gherkin acceptance tests (Cucumber.js)
│   ├── authentication.feature
│   ├── tool_listings.feature
│   ├── borrow_requests.feature
│   ├── reviews.feature
│   ├── browse_search.feature
│   ├── moderation.feature
│   ├── gdpr.feature
│   ├── security.feature
│   └── step_definitions/
│       ├── world.js          # Cucumber World with shared state + helpers
│       ├── authentication.steps.js
│       ├── tools.steps.js
│       ├── requests.steps.js
│       ├── reviews.steps.js
│       ├── moderation.steps.js
│       ├── gdpr.steps.js
│       └── security.steps.js
│
├── .husky/                   # Git hooks (pre-commit, commit-msg)
├── .eslintrc.js
├── .prettierrc
├── commitlint.config.js
└── package.json              # Workspaces root
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| i18n | i18next + react-i18next |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Passport.js (Local + Google OAuth + Facebook + JWT) |
| Email | SendGrid or Resend |
| Image processing | Sharp + Multer |
| Testing | Jest (unit) + Cucumber.js (acceptance) |
| Linting | ESLint + Prettier |
| Git hooks | Husky + lint-staged + commitlint |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- A SendGrid or Resend API key (for emails)
- Google OAuth credentials (optional)
- Facebook App credentials (optional)

### Backend setup

```bash
cd toolshare/backend

# Copy and fill in environment variables
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Apply database migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev
```

### Frontend setup

```bash
cd toolshare/frontend

# Copy and fill in environment variables
cp .env.example .env

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies API requests to `http://localhost:3001`.

---

## Running Tests

### Unit tests (Jest)

```bash
cd toolshare/backend
npm test
```

### Acceptance tests (Cucumber.js / Gherkin)

```bash
cd toolshare/backend
npm run test:e2e
```

The acceptance tests require a running PostgreSQL database. Set `DATABASE_URL` to a test database in your `.env`.

---

## API Reference

| Method | Route | Description | Auth required |
|---|---|---|---|
| `GET` | `/tools` | Browse all tools (filterable) | No |
| `POST` | `/tools` | Create a tool listing | Verified account |
| `GET` | `/tools/:id` | Get tool details | No (address masked unless accepted) |
| `PATCH` | `/tools/:id` | Update a listing | Owner only |
| `DELETE` | `/tools/:id` | Delete a listing | Owner only |
| `POST` | `/requests` | Send a borrow request | Verified account |
| `GET` | `/requests` | Get own requests | Auth |
| `PATCH` | `/requests/:id` | Accept / decline / cancel / return | Auth |
| `POST` | `/reviews` | Submit a review | Auth |
| `GET` | `/reviews/user/:id` | Get reviews for a user | No |
| `POST` | `/reports` | Report a listing or review | Auth |
| `GET` | `/reports` | List reports | Admin only |
| `PATCH` | `/reports/:id` | Resolve a report | Admin only |
| `POST` | `/auth/register` | Create account | No |
| `POST` | `/auth/login` | Log in | No |
| `POST` | `/auth/logout` | Log out | Auth |
| `POST` | `/auth/refresh` | Refresh access token | No |
| `GET` | `/auth/me` | Get current user | Auth |
| `GET` | `/auth/google` | Google OAuth flow | No |
| `GET` | `/auth/facebook` | Facebook OAuth flow | No |
| `GET` | `/users/:id` | Public user profile | No |
| `PATCH` | `/users/me` | Update profile | Auth |
| `DELETE` | `/users/me` | Delete account (GDPR) | Auth |
| `POST` | `/users/me/download-data` | Request data export (GDPR) | Auth |

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens (15 min) + refresh tokens (7 days) in HTTP-only cookies
- Login rate limited to 5 attempts per 15 minutes per IP
- OAuth state parameter validated (CSRF protection)
- Full pick-up address only revealed after request is accepted
- Input sanitised via express-validator
- SQL injection prevented by Prisma parameterised queries
- Helmet.js security headers + CORS whitelist
- API body size capped at 10kb; file uploads at 5MB
- Secrets stored in environment variables only

---

## GDPR Compliance

- Users can download all their personal data (right to access)
- Users can delete their account (right to erasure); data purged within 30 days
- Reviews are anonymised on account deletion (not deleted, as they belong to others)
- All personal data stored on EU servers
- Transactional emails are mandatory (no opt-out) — legal basis: contract

---

## Accessibility

WCAG 2.1 Level AA:
- All interactive elements keyboard-accessible with visible focus indicators
- `aria-label`, `aria-describedby`, and `role` attributes on all interactive/semantic elements
- Form errors linked to fields via `aria-invalid` and `aria-describedby`
- Colour contrast ≥ 4.5:1 for all text
- Screen-reader friendly skip link and live regions
- Star rating component accessible as both display and interactive input

---

## Internationalisation

- Default language: **Danish** (`da`)
- Supported: Danish + English
- All strings in `/locales/da.json` and `/locales/en.json` — nothing hardcoded in components
- Language toggle in navbar persists to user account and localStorage
- Transactional emails sent in recipient's `preferredLanguage`

---

## Versioning

Follows **Semantic Versioning** (MAJOR.MINOR.PATCH). Current version: **v1.0.0**.

Releases are published as GitHub Releases with Git tags.

---

*ToolShare v1.0 — Built to spec*

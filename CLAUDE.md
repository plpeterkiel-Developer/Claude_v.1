# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

---

## Project Overview

**Name:** Claude_v.1
**Description:** Initial exploration project for working with Claude (Anthropic's AI assistant).
**Status:** Early-stage / greenfield — no production source code yet.
**Repository:** [plpeterkiel-Developer/Claude_v.1](http://local_proxy@127.0.0.1:33270/git/plpeterkiel-Developer/Claude_v.1)

---

## Repository Structure

```
Claude_v.1/
├── CLAUDE.md        # AI assistant guidance (this file)
└── README.md        # Project overview
```

This is a brand-new repository. As development progresses, update this section to reflect new directories and files.

---

## Git Workflow

### Branches

| Branch | Purpose |
|--------|---------|
| `master` | Stable baseline |
| `main` (remote) | Remote default branch |
| `claude/<feature>-<id>` | Feature/task branches created by Claude |

### Branch Naming Convention

Claude-created branches must follow the pattern:

```
claude/<short-description>-<session-id>
```

Example: `claude/add-claude-documentation-IxE96`

**Critical:** Branch names must start with `claude/` and end with the matching session ID. Pushes to branches that don't match this pattern will fail with HTTP 403.

### Standard Git Workflow

```bash
# 1. Ensure you are on the correct feature branch
git checkout claude/<feature>-<id>

# 2. Make changes, then stage specific files (avoid `git add -A`)
git add <file1> <file2>

# 3. Commit with a descriptive message
git commit -m "feat: describe what was done and why"

# 4. Push (always use -u on first push)
git push -u origin claude/<feature>-<id>
```

### Push Retry Policy

If a push fails due to a **network error**, retry with exponential backoff:

| Attempt | Wait before retry |
|---------|-------------------|
| 1st retry | 2 seconds |
| 2nd retry | 4 seconds |
| 3rd retry | 8 seconds |
| 4th retry | 16 seconds |

Never retry on HTTP 403 (permission denied) — check the branch name instead.

### Commit Message Style

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <short summary>

[optional body]

[optional footer, e.g. issue refs]
```

Common types:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `refactor` — code change with no feature/fix
- `test` — adding or updating tests
- `chore` — tooling, dependencies, config

**Keep the subject line under 72 characters.**

---

## Development Guidelines for AI Assistants

### Before Making Changes

1. **Read before editing** — always read a file before modifying it.
2. **Understand context** — search for related code to avoid duplication.
3. **Prefer editing over creating** — update existing files rather than creating new ones when possible.

### Code Quality

- Keep changes minimal and focused on the stated task.
- Do not add unrequested features, comments, docstrings, or refactors.
- Do not add error handling for scenarios that cannot realistically occur.
- Delete unused code completely rather than commenting it out.
- Avoid backwards-compatibility shims unless explicitly required.

### Security

- Never commit secrets, API keys, tokens, or credentials.
- Validate input at system boundaries (user input, external API responses).
- Avoid introducing OWASP Top 10 vulnerabilities (SQLi, XSS, command injection, etc.).
- If a `.env.example` exists, use it as the template; never commit a real `.env`.

### File Operations

- Use targeted file staging (`git add <file>`) — never `git add -A` or `git add .` blindly.
- Do not create `*.md` documentation files unless explicitly requested.
- Do not create temporary scratch files in the repository.

---

## Environment Setup

> This section should be updated as the project gains a defined stack and dependencies.

### Prerequisites (to be defined)

- Programming language runtime (TBD)
- Package manager (TBD)
- Any external services or APIs (TBD)

### First-Time Setup (to be defined)

```bash
# Clone the repository
git clone <repo-url>
cd Claude_v.1

# Install dependencies (once defined)
# <install command here>

# Configure environment (once defined)
# cp .env.example .env
```

---

## Testing

> No tests exist yet. Update this section when a testing framework is introduced.

### Running Tests (to be defined)

```bash
# <test command here>
```

### Conventions

- All new features should have corresponding tests.
- Tests should be co-located with source code or in a top-level `tests/` directory (decide and document when the project matures).
- CI should run tests automatically on every push (to be configured).

---

## CI/CD

> No CI/CD configuration exists yet. Update this section when pipelines are added.

Planned: GitHub Actions (or equivalent) for automated test runs and linting on every pull request.

---

## Updating This File

This `CLAUDE.md` should be kept current. When the project evolves:

- Add new directory entries to the **Repository Structure** section.
- Document chosen tech stack, language, and frameworks under **Environment Setup**.
- Fill in real test and build commands under **Testing** and **CI/CD**.
- Add language-specific or framework-specific conventions as they emerge.

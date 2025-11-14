<!--
Auto-generated: guidance for AI coding agents working on this repository.
If you (human) have additional developer notes, please paste them into `README.md`
or update this file so AI agents can merge them.
-->

# Copilot instructions for this repository

Purpose

- Short goal: Help contributor AI produce targeted, minimal changes for the student assignment repository named `TUGAS-UTS-EAI`.

Repository snapshot

- The repository currently contains a minimal `README.md` at the project root and no visible source or build files. Treat this as a small student assignment workspace unless the user provides more files.

Agent rules (project-specific)

- Confirm intent before making structural assumptions: there are no build/test files discoverable; ask the user what language/framework this assignment uses before scaffolding.
- Do not create large frameworks or change repository layout without explicit user approval.
- Prefer small, reversible commits focused on the user's request; use descriptive commit messages.

Where to look first

- `README.md` — current project description (minimal). Use this to confirm project title and find any human instructions.
- Root of repo — check for new files the user may add (source, tests, build configs).

Typical workflows & commands

- The workspace uses Windows/PowerShell. When suggesting copy-paste commands for contributors, use PowerShell syntax. Example common git workflow used in this environment:

```powershell
git add . ; git commit -m "Describe change" ; git push -u origin main
```

- If asked to run tests or build, request user-provided commands or a sample `package.json`, `requirements.txt`, `Makefile`, or build script before guessing.

Patterns & conventions discovered

- No language-specific conventions are discoverable from current files. Follow these conservative defaults until told otherwise:
  - Keep file-level changes minimal.
  - Add new files under clearly scoped folders (e.g., `src/`, `tests/`) and explain the change in the commit message.

Integration & external dependencies

- None discovered. If you need external services (APIs, DBs, CI), ask the user for credentials, config files, or CI provider details.

How to propose changes

- For non-trivial changes, produce a short plan (3–5 steps) and present it before editing. Example plan:
  1. Add `src/` with initial file
  2. Add `README` section documenting how to run
  3. Run tests (if provided)

Merging guidance

- If this file already exists, merge by preserving any explicit human-written instructions and appending missing workspace-specific tips. If you detect conflicting guidance, ask the user.

Example edits an agent can safely make

- Add a helpful `CONTRIBUTING.md` or tests only after asking for the language/runtime.
- Small bug fixes in user-supplied code; include unit tests where possible.

Questions to ask the user when context is missing

- Which language and runtime should I assume (Python, Node, Java, etc.)?
- Are there any hidden files or commands you run locally to build/test this assignment?
- Do you want me to scaffold a starter structure (e.g., `src/`, `tests/`)?

If more repository files are added, re-run discovery and update this document with exact examples (file paths, build commands, and tests).

Merged guidance from external repo `kyeiki/UTS-IAE`

- This project is a student assignment (UTS) that expects a microservice-style layout: an `api-gateway/` plus multiple `service-*` folders and an optional `frontend/` and `docs/` directory. Use this structure when scaffolding or merging examples.
- Common example stacks shown in that repository:
  - Node.js/Express API Gateway with `http-proxy-middleware`, JWT auth, and `package.json` scripts (`start`, `dev`). Example gateway default port: `3000`.
  - Flask services (Flask-RESTX) with `requirements.txt`, `.env`, `app.py`, `models.py`, and SQLite database. Example service default ports: `3001`, `3002`, etc.
- Helpful scripts: `scripts/start-all.sh` and `scripts/start-all.bat` (or `start-all.sh` / `start-all.bat` at repo root) are used to run gateway + services concurrently on Windows and Unix. When adding run instructions, prefer PowerShell examples in this workspace.
- Environment variables commonly used:
  - `PORT`, `JWT_SECRET`, `DATABASE_URL`, `SERVICE_NAME`, and per-service ports like `SERVICE1_PORT=3001`.
- Documentation and deliverables the assignment expects:
  - API documentation via Swagger/OpenAPI (exposed at `/api-docs`) or Postman collections + environment JSONs.
  - Exports: Postman collection `.json` (v2.1 recommended) and environment file.
  - README per service with setup, `.env` example, and run instructions.
- Testing & examples found in the external README:
  - Postman test snippets (assert status, response shape) and pre-request scripts for auth tokens.
  - Example `package.json` and `requirements.txt` to copy when scaffolding services.
- Grading rubric notes (useful to mention in PRs and commit messages): focus on architecture and API communication (30%), functionality (25%), documentation (20%), and presentation/understanding (25%). Aim to include Swagger/Postman docs and runnable start scripts to meet expectations.

What to do when you find code

- Preserve service boundaries: avoid collapsing multiple services into a single folder unless the user asks.
- When adding a sample service, include a minimal `README.md`, `requirements.txt` or `package.json`, and an `.env.example` with default ports matching the gateway config.

Questions to ask the user when context is missing

- Which language/runtime should I scaffold for new services (Node.js or Python/Flask)?
- Do you want helper scripts (`start-all.bat` / `start-all.sh`) added for Windows and Unix?
- Where should I place exported Postman collections and environment files (`docs/` or `postman/`)?

---

End of guidance.

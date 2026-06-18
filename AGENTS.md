# AGENTS.md

## Purpose

This file defines rules for AI coding agents working on this repository.

The repository is intended to be compatible with AI-assisted development,
especially Codex-style agents that can read files, modify code and run commands.

Agents must follow this file before making changes.

---

## Project Summary

This project is an internal stateless AI translation service.

It is built to translate structured text fields through a local Ollama model and
return structured translated fields to a consuming application such as
`patrick-dev-site`.

The service is not a public website and not a general SaaS translation platform.

---

## Required Reading Before Changes

Before making code or architecture changes, read:

```txt
README.md
ARCHITECTURE.md
TASKS.md
AGENTS.md
```

When working on infrastructure, also read:

```txt
docker-compose.yml
Dockerfile
.env.example
```

When working on translation behavior, also inspect:

```txt
src/translation/
src/prompts/
src/ollama/
```

When working on HTTP routes, also inspect:

```txt
src/app.ts
src/routes/
src/security/
```

---

## Working Principles

Agents must keep changes:

- small
- focused
- reversible
- explicit
- consistent with the service boundary
- documented when they affect architecture or setup

Prefer completing one task from `TASKS.md` at a time.

Do not combine unrelated features in one change.

Use npm for this repository. Do not introduce pnpm, Yarn or Bun lockfiles unless
the user explicitly requests a package-manager migration.

When environment variables change, update `.env.example` in the same task.

When deployment behavior, ports, service names or network exposure changes,
update `README.md`, `ARCHITECTURE.md`, `AGENTS.md` or deployment notes as
appropriate.

---

## Service Boundary

This service is responsible for:

- structured translation requests
- Ollama communication
- prompt templates
- output parsing
- output validation
- retry/repair of malformed model output
- warning and timing metadata

This service is not responsible for:

- website database writes
- translation record persistence
- workflow state such as draft/machine/reviewed/published
- public rendering
- admin UI
- user authentication beyond internal API key protection
- automatic publishing

The consuming application, such as `patrick-dev-site`, owns translation records
and review/publish decisions.

---

## Architecture Rules

Use the established stack unless explicitly instructed otherwise.

### Backend Stack

Use:

```txt
Node.js
TypeScript
Fastify
Zod
Ollama HTTP API
```

Do not replace with:

```txt
NestJS
Express
Hono
Koa
Python/FastAPI
Go
Rust
```

unless explicitly requested and documented in `ARCHITECTURE.md`.

### Persistence

Do not add a database in the first version.

Do not add:

```txt
PostgreSQL
SQLite
MongoDB
Redis persistence
Prisma
Drizzle
TypeORM
```

unless a later task explicitly changes the service from stateless to persistent.

### Queues

Do not add a queue in the first version.

Do not add:

```txt
BullMQ
RabbitMQ
Kafka
Redis queues
background worker process
```

unless synchronous translation proves insufficient and a task explicitly plans
job handling.

### Frontend

Do not add a public frontend.

Do not add:

```txt
React app
Astro app
Next.js app
admin UI
public translation form
```

unless explicitly requested.

---

## API Rules

Expected initial routes:

```txt
GET /health
POST /translate
```

`POST /translate` must require:

```txt
Authorization: Bearer <API_KEY>
```

Do not expose arbitrary prompt execution endpoints.

Do not add public model playground endpoints.

Do not add browser-facing endpoints.

Error responses should be structured:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

---

## Translation Rules

Translation requests should use structured fields.

Allowed pattern:

```json
{
  "sourceLocale": "de",
  "targetLocale": "en",
  "contentType": "managed-page-section",
  "fields": {
    "title": "Kontakt",
    "body": "Schreib mir..."
  }
}
```

Do not translate:

- field keys
- slugs
- route paths
- technical identifiers
- variable names
- code blocks
- URLs
- placeholder tokens
- project stack/status values unless explicitly part of a text field
- legal content without explicit review workflow

The response must preserve exactly the input field keys.

---

## Prompt Rules

Prompts must be server-owned and version-controlled.

Do not allow arbitrary prompt editing through the API in the first version.

Prompt templates must instruct the model to:

- return JSON only
- preserve field keys
- preserve Markdown
- preserve code blocks
- preserve URLs
- preserve placeholders
- respect glossary terms
- avoid explanations outside JSON

---

## Ollama Rules

All Ollama-specific behavior belongs in:

```txt
src/ollama/
```

Routes and high-level translation services must not construct raw Ollama HTTP
requests directly.

Ollama settings must come from environment variables:

```txt
OLLAMA_BASE_URL
OLLAMA_MODEL
REQUEST_TIMEOUT_MS
```

Do not hardcode model names except as safe local examples in `.env.example`.

---

## Validation Rules

Use Zod for:

- environment configuration where practical
- translate request body
- translate response body
- parsed model output
- internal contract validation where useful

Reject invalid input before calling Ollama.

Enforce `MAX_INPUT_CHARS` before model calls.

---

## Logging and Privacy Rules

Do not log full source text by default.

Do not log full model responses by default.

Allowed logs:

- request id if added
- source locale
- target locale
- content type
- number of fields
- input size
- model name
- duration
- warning count
- error code

Never log:

- API key
- full private content
- full raw AI response
- secrets
- `.env` contents

---

## Security Rules

The service must remain internal.

Do not add:

- public reverse proxy route
- Cloudflare Tunnel route
- public CORS setup
- public demo page
- unauthenticated translation route

API key protection is required for translation endpoints.

Never commit real secrets.

---

## Environment Variable Rules

All environment variables must be documented in `.env.example`.

Required initial variables:

```txt
NODE_ENV
PORT
API_KEY
OLLAMA_BASE_URL
OLLAMA_MODEL
REQUEST_TIMEOUT_MS
MAX_INPUT_CHARS
LOG_LEVEL
```

Use safe placeholder values only.

---

## Docker and Deployment Rules

Deployment should remain compatible with:

```txt
Docker Compose
Portainer Stack
```

Do not introduce:

```txt
Kubernetes
Helm
Terraform
Nomad
Docker Swarm-only features
```

unless explicitly requested.

Do not add public reverse proxy labels by default.

The service should listen internally on port `4100`.

---

## Coding Standards

Use TypeScript strict mode.

Avoid:

```txt
any
implicit any
untyped API responses
duplicated types
large files with mixed responsibilities
catch blocks that erase useful error context
```

Prefer:

```txt
explicit types
small modules
Zod schemas at boundaries
clear error codes
provider-specific code behind clients
deterministic tests with mocked Ollama behavior
```

Use `unknown` instead of `any` when the type is not known.

---

## Naming

Use clear, boring names.

Examples:

```txt
TranslateRequest
TranslateResponse
OllamaClient
buildTranslationPrompt
validateTranslatedFields
requireApiKey
```

Avoid vague names:

```txt
Stuff
Helper
Manager
Thing
Doer
AIThing
```

---

## Forbidden Early Additions

Do not add the following unless explicitly requested:

- database
- queues
- workers
- public frontend
- admin UI
- user accounts
- OAuth
- roles
- payment
- analytics
- translation memory database
- glossary management UI
- generic prompt playground
- public AI endpoint
- external SaaS AI provider
- automatic publication into `patrick-dev-site`
- direct writes into the `patrick-dev-site` database

---

## Test-From-Start Rule

Tests are part of the implementation from Phase 0.1 onward.

Agents must add or update tests in the same task whenever they add behavior that
can be tested deterministically.

Examples:

```txt
health route               -> route test
API key middleware         -> authorized/unauthorized tests
config validation          -> config tests
request schemas            -> schema tests
prompt builder             -> prompt tests
Ollama client              -> mocked provider tests
translation service        -> mocked integration tests
error mapping              -> structured error tests
```

Do not defer tests to a separate late stabilization phase when the behavior is
small and testable in the current task.

Live Ollama tests are optional manual smoke checks only. Automated tests must
mock Ollama/provider behavior.

## Testing Rules

Prefer tests for:

- config validation
- API key middleware
- request validation
- input length limit
- prompt builder
- mocked Ollama success
- mocked Ollama invalid JSON
- translated key validation
- timeout/provider error mapping

CI tests must not require a live Ollama model.

Live model smoke checks may be documented as manual local checks only.

---

## Quality Checks

Before finishing a coding task, run the checks that are available and relevant:

```bash
npm install
npm run typecheck
npm test
npm run build
docker compose config
```

If a check cannot be run, state why.

Do not claim checks passed unless they were actually run.

---

## Git and Change Discipline

Prefer small, focused commits.

Do not rewrite unrelated files.

Do not reformat the entire repository unless the task is specifically formatting.

Do not delete existing documentation or project structure unless explicitly asked.

---

## Task Execution Rules

When selecting work:

1. Read `TASKS.md`.
2. Pick the next incomplete task unless the user requested a specific task.
3. Implement only that task and directly required supporting changes.
4. Update task status if appropriate.
5. Run relevant checks.
6. Summarize changed files and verification results.

---

## Communication Rules for Agent Summaries

When reporting results, include:

```txt
changed files
what was implemented
checks run
checks failed, if any
next recommended task
```

Do not give vague summaries like:

```txt
made improvements
updated stuff
fixed things
```

# AI Translation Service

Internal stateless AI translation service for structured project/content translation.

This service is intended to be consumed by `patrick-dev-site` and later by other
private tools or projects. It receives structured text fields, translates them
through a local Ollama model and returns structured translated fields.

The service is deliberately separated from `patrick-dev-site` so the website
does not become responsible for model orchestration, prompt handling, retries,
timeouts or AI provider-specific behavior.

---

## Purpose

The service translates structured content packages from one locale into another.

Initial use case:

```txt
patrick-dev-site admin
  -> request machine translation for a known content entity
  -> ai-translation-service translates fields via Ollama
  -> patrick-dev-site stores the result as machine translation
  -> human review is required before published status
```

The service is not a public translation website, not a SaaS product and not a
generic document translation platform.

---

## Current Scope

Initial target scope:

- internal HTTP API
- Fastify server
- TypeScript strict mode
- Zod request/response validation
- Ollama HTTP API client
- prompt templates for translation
- JSON-only model output handling
- retry/repair for malformed model output
- request timeout handling
- max input length protection
- Docker/Portainer-compatible deployment
- API key protection between internal callers and this service

Implemented in Phase 0.1:

- Fastify/TypeScript service foundation
- Zod environment configuration
- `GET /health`
- protected placeholder `POST /translate`
- structured baseline error responses
- Vitest test baseline
- Docker Compose runtime baseline

Implemented in Phase 0.2:

- translation request and response schemas
- request payload validation for `POST /translate`
- max input length enforcement
- translated field key preservation helper
- contract tests for schemas, validation helpers and route behavior

Implemented in Phase 0.3:

- isolated Ollama `/api/chat` client
- Ollama chat response schema validation
- timeout, connection, non-2xx and invalid-response error normalization
- mocked Ollama tests with no live model requirement

Implemented in Phase 0.4:

- server-owned translation and repair prompt templates
- prompt builder for Ollama chat messages
- bounded repair prompt input for invalid model output
- prompt builder tests

Implemented in Phase 0.5:

- synchronous translate service
- `POST /translate` wired to prompt builder and Ollama client
- JSON model output parsing for `{ "fields": { ... } }`
- translated field key validation before responding
- mocked route/service tests for provider and model-output failures

Implemented in Phase 0.6:

- one bounded repair retry for invalid model output
- repair warnings in successful responses
- full-operation `durationMs` including repair attempts
- explicit retry boundary tests

Provider failures such as timeouts and unavailable Ollama responses are not
repair-retried. Invalid model output returns `MODEL_OUTPUT_INVALID` if the one
repair attempt also fails.

Out of scope for the first version:

- database
- queues
- background workers
- public frontend
- public Cloudflare route
- user accounts
- role system
- OAuth
- translation memory
- glossary database
- persisted job history
- automatic publishing
- legal text automation without review
- live translation on public page requests

---

## Tech Stack

- Node.js
- TypeScript
- Fastify
- Zod
- Ollama HTTP API
- Docker
- Docker Compose / Portainer Stack

---

## Repository Structure

```txt
ai-translation-service/
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config.ts
│   ├── routes/
│   │   ├── health.routes.ts
│   │   └── translate.routes.ts
│   ├── translation/
│   │   ├── translate.service.ts
│   │   ├── translate.schema.ts
│   │   └── translate.types.ts
│   ├── ollama/
│   │   ├── ollama.client.ts
│   │   └── ollama.schema.ts
│   ├── prompts/
│   │   ├── prompt-builder.ts
│   │   └── templates.ts
│   ├── security/
│   │   └── api-key.ts
│   └── logging/
│       └── logger.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
├── AGENTS.md
└── TASKS.md
```

---

## Setup

Install dependencies:

```bash
npm install
```

Copy the environment example for local development:

```bash
cp .env.example .env
```

Run the development server:

```bash
npm run dev
```

Useful npm commands:

```bash
npm run typecheck
npm test
npm run build
npm start
```

This repository uses npm. Do not create pnpm, Yarn or Bun lockfiles unless that
is explicitly requested.

---

## API

### `GET /health`

Expected response:

```json
{
  "status": "ok",
  "service": "ai-translation-service"
}
```

This endpoint is intentionally public inside the private network and does not
require an API key.

---

### `POST /translate`

Protected by:

```http
Authorization: Bearer <API_KEY>
```

Translation request:

```bash
curl -i -X POST http://localhost:4100/translate \
  -H "Authorization: Bearer DEV_SECRET_CHANGE_ME" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLocale": "de",
    "targetLocale": "en",
    "contentType": "managed-page-section",
    "fields": {
      "title": "Kontakt",
      "body": "Schreib mir..."
    },
    "tone": "personal-technical",
    "glossary": {
      "Devlog": "Devlog"
    }
  }'
```

Translation response:

```json
{
  "model": "qwen2.5:7b",
  "targetLocale": "en",
  "fields": {
    "title": "Contact",
    "body": "Write to me if you have questions about my projects."
  },
  "warnings": [],
  "durationMs": 12400
}
```

If malformed model output is repaired successfully, `warnings` includes:

```json
["model_output_repaired"]
```

---

## Translation Contract

The service translates field values only.

Rules:

- field keys must be preserved exactly
- all translated values must be strings
- response must contain exactly the same field keys as the input
- request `fields` must be a non-empty object of string values
- empty string field values are allowed
- optional `glossary` must be a string-to-string object
- combined model input length is limited by `MAX_INPUT_CHARS`
- Markdown syntax must be preserved where possible
- URLs, code blocks, placeholders and variable names must be preserved
- glossary terms must be respected
- translated output must be returned as structured JSON
- no explanation text should be returned by the model

Supported initial locales:

```txt
de
en
th
```

Supported initial content types:

```txt
managed-page
managed-page-section
project
devlog
generic
```

---

## Environment Variables

Copy `.env.example` to `.env` for local development.

```env
NODE_ENV=production
PORT=4100

API_KEY=DEV_SECRET_CHANGE_ME

OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:7b

REQUEST_TIMEOUT_MS=60000
MAX_INPUT_CHARS=12000

LOG_LEVEL=info
```

Never commit real secrets.

Production or LAN deployments should provide secrets through Portainer
environment variables or another private environment source.

---

## Docker Compose

Build and start the service:

```bash
docker compose up --build
```

The compose service is named `ai-translation-service`, publishes
`127.0.0.1:4100:4100` for local testing and does not include public reverse
proxy labels. It includes `host.docker.internal:host-gateway` so a container can
reach an Ollama instance running on the Docker host.

Validate the compose file:

```bash
docker compose config
```

For repeatable Docker/Portainer runtime checks, use
[docs/runtime-smoke-checklist.md](docs/runtime-smoke-checklist.md).
Live Ollama smoke checks are manual and are not required for automated tests.

---

## Local Smoke Checks

Health:

```bash
curl -i http://localhost:4100/health
```

Unauthorized placeholder translate:

```bash
curl -i -X POST http://localhost:4100/translate \
  -H "Content-Type: application/json" \
  -d '{}'
```

Authorized placeholder translate:

```bash
curl -i -X POST http://localhost:4100/translate \
  -H "Authorization: Bearer DEV_SECRET_CHANGE_ME" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLocale": "de",
    "targetLocale": "en",
    "contentType": "managed-page-section",
    "fields": {
      "title": "Kontakt"
    }
  }'
```

Expected model output shape:

```json
{
  "fields": {
    "title": "Contact"
  }
}
```

The service parses that model output, validates field keys and returns the
`TranslateResponse` shape shown above.

If the first model output is invalid JSON, lacks the `fields` wrapper, has
missing/extra field keys or has non-string field values, the service makes one
synchronous repair attempt using a bounded repair prompt. It does not use a
queue or background worker.

---

## Ollama Client

The Ollama client lives under `src/ollama/` and is isolated from route-level HTTP
request construction. It
uses `OLLAMA_BASE_URL`, `OLLAMA_MODEL` and `REQUEST_TIMEOUT_MS`, calls
`POST /api/chat` with `stream: false`, validates the provider response and
returns only the assistant message content.

Automated tests mock Ollama behavior and do not require a live Ollama model.
`POST /translate` now uses the client through the translation service.

---

## Prompt Templates

Prompt templates live under `src/prompts/` and are server-owned,
version-controlled code. The API does not expose arbitrary prompt editing.

The prompt builder creates Ollama chat messages for normal translation and for
repairing invalid model output. Repair prompts bound previous invalid output
before including it. Normal translation prompts and repair prompts are used by
the translation service.

---

## Security

This service is internal-only. Do not expose it through public reverse proxy,
Cloudflare Tunnel or browser-facing routes by default. `GET /health` is
unauthenticated for private-network health checks; `POST /translate` requires
`Authorization: Bearer <API_KEY>`.

Never commit real secrets.

---

## Testing

Tests are part of the project from the beginning, not a later stabilization step.

Initial test stack:

```txt
Vitest
Fastify inject or lightweight HTTP route tests
Mocked Ollama client/provider behavior
```

Expected test focus from Phase 0.1 onward:

- config validation
- health route
- API key middleware
- placeholder translate route protection
- request validation
- max input length behavior
- prompt builder behavior
- translated field key validation
- mocked Ollama success and failure behavior
- structured error responses

Run tests:

```bash
npm test
```

Run tests in watch mode if configured:

```bash
npm run test:watch
```

CI and normal agent validation should use mocked Ollama behavior. Live model
checks are manual smoke checks only and must not be required for automated test
success.

## Local Development

Install dependencies:

```bash
npm install
```

Run in development mode:

```bash
npm run dev
```

Run type checks:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

Start compiled service:

```bash
npm run start
```

---

## Local Smoke Checks

Health:

```bash
curl -i http://localhost:4100/health
```

Protected route without API key should fail:

```bash
curl -i -X POST http://localhost:4100/translate \
  -H "Content-Type: application/json" \
  -d '{}'
```

Protected route with API key:

```bash
curl -i -X POST http://localhost:4100/translate \
  -H "Authorization: Bearer DEV_SECRET_CHANGE_ME" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLocale": "de",
    "targetLocale": "en",
    "contentType": "managed-page-section",
    "fields": {
      "title": "Kontakt",
      "body": "Schreib mir, wenn du Fragen zu meinen Projekten hast."
    },
    "tone": "personal-technical",
    "glossary": {
      "Devlog": "Devlog",
      "Alpendorf": "Alpendorf"
    }
  }'
```

---

## Docker / Portainer

The service should run as an internal service. Do not publish it through a public
reverse proxy.

Example deployment shape:

```txt
patrick-dev-site API
  -> internal Docker/LAN HTTP
  -> ai-translation-service:4100
  -> Ollama
```

If Ollama runs on the Docker host:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

If Ollama runs as a Docker service in the same network:

```env
OLLAMA_BASE_URL=http://ollama:11434
```

---

## Security Notes

- keep the service internal
- require API key for translation routes
- do not expose the service through Cloudflare/Nginx Proxy Manager publicly
- do not log full source text by default
- enforce max input length
- enforce request timeouts
- avoid raw AI request/response persistence
- use mocked providers in tests where possible
- generated translations must be reviewed by the consuming application before publishing

---

## Relationship to `patrick-dev-site`

`patrick-dev-site` remains responsible for:

- source content
- translation records
- translation workflow state
- admin UI buttons
- review/publish decisions
- public rendering and fallback behavior

`ai-translation-service` is responsible for:

- structured translation execution
- Ollama communication
- prompt templates
- output parsing
- validation
- retry/repair
- warnings and timing metadata

The service should not write into the website database.

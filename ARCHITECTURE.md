# Architecture

## Overview

`ai-translation-service` is a small internal service for structured AI-assisted
translation.

It is designed as a separate runtime from the consuming application. The
downstream application owns content and translation records. This service only
receives structured fields, translates them through Ollama and returns
structured output.

---

## Architectural Goals

The architecture should provide:

- strict service boundary between website and AI orchestration
- stateless translation endpoint
- predictable JSON request/response contracts
- strong TypeScript typing
- Zod validation at the HTTP boundary
- provider isolation behind an Ollama client
- prompt templates kept server-side
- safe timeout and input length limits
- internal-only network exposure
- Docker/Portainer-ready deployment
- simple future expansion to more content types or models

---

## High-Level Runtime Architecture

```txt
client Admin UI
   |
   v
client API
   |
   | internal HTTP + API key
   v
ai-translation-service
   |
   | Ollama HTTP API
   v
Ollama / Qwen model
```

The public website never calls the AI service directly.

---

## Responsibility Split

### Consuming Application

Responsible for:

- source content management
- translation database tables
- German source records
- EN/TH translation records
- workflow states: draft, machine, reviewed, published
- stale/source freshness tracking
- admin UI buttons
- human review and publishing
- public fallback behavior
- public rendering

Not responsible for:

- Ollama prompt orchestration
- model retry handling
- model output repair
- AI provider-specific logic

---

### `ai-translation-service`

Responsible for:

- accepting structured translation requests
- validating payloads
- building translation prompts
- calling Ollama
- enforcing timeouts
- parsing JSON model output
- validating translated field keys and values
- retrying/repairing malformed model output
- returning warnings and metadata

Not responsible for:

- consuming application database writes
- content persistence
- translation workflow publishing
- admin user authentication
- public rendering
- long-running job queues in the first version

---

## Repository Layout

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
├── docs/
│   ├── examples/
│   ├── client-integration-contract.md
│   ├── model-evaluation-notes.md
│   ├── runtime-smoke-checklist.md
│   └── service-readiness-review.md
├── .env.example
├── README.md
├── ARCHITECTURE.md
├── AGENTS.md
└── TASKS.md
```

---

## Module Responsibilities

### `src/server.ts`

Starts the HTTP server.

Responsibilities:

- load config
- build Fastify app
- listen on configured host/port
- handle startup errors

---

### `src/app.ts`

Creates and configures the Fastify app.

Responsibilities:

- register routes
- register common error handling
- register request logging if needed
- keep app construction testable

---

### `src/config.ts`

Reads and validates environment variables.

Required variables:

```txt
PORT
API_KEY
OLLAMA_BASE_URL
OLLAMA_MODEL
REQUEST_TIMEOUT_MS
MAX_INPUT_CHARS
LOG_LEVEL
```

Configuration must fail fast when required values are invalid.

---

### `src/routes/health.routes.ts`

Defines `GET /health`.

This route should be simple and not depend on Ollama availability in the first
version. A deeper model readiness endpoint may be added later if useful.

---

### `src/routes/translate.routes.ts`

Defines `POST /translate`.

Responsibilities:

- require API key
- validate request body against the translation contract
- enforce `MAX_INPUT_CHARS`
- call translation service
- return validated translate responses
- return structured errors

---

### `src/security/api-key.ts`

Validates the internal caller.

Expected behavior:

```txt
Authorization: Bearer <API_KEY>
```

Rejected calls should return a structured 401 response without revealing the
configured API key.

---

### `src/translation/`

Contains translation-specific orchestration.

Responsibilities:

- validate translation request/response shapes
- calculate input size
- validate translated field key preservation
- select prompt template
- call Ollama client
- parse response
- retry repair once for invalid model output shape
- assemble warnings and duration metadata

---

### `src/ollama/`

Contains all Ollama-specific HTTP behavior.

Responsibilities:

- call Ollama `/api/chat`
- apply request timeout
- return model output text
- validate the relevant provider response shape
- normalize provider errors, timeouts and invalid responses
- avoid leaking full source text in logs

No route should call Ollama directly.

---

### `src/prompts/`

Contains server-owned prompt templates.

Responsibilities:

- force JSON-only output
- preserve field names
- preserve Markdown, URLs, placeholders and code
- respect glossary mappings
- keep tone consistent
- prohibit explanations outside JSON
- build normal translation Ollama chat messages
- build bounded repair Ollama chat messages for invalid model output

Prompt editing should remain code-owned in the first version.

---

### `src/logging/`

Contains logging helpers.

Logging rules:

- log request metadata and duration
- log content type, source locale, target locale and model name
- do not log full source content by default
- do not log full AI output by default
- log validation and provider errors safely

---

## API Contract

### Translate Request

```ts
type TranslateRequest = {
  sourceLocale: "de" | "en" | "th";
  targetLocale: "de" | "en" | "th";
  contentType:
    | "managed-page"
    | "managed-page-section"
    | "project"
    | "devlog"
    | "generic";
  fields: Record<string, string>;
  tone?: "neutral" | "personal-technical" | "professional" | "playful";
  glossary?: Record<string, string>;
};
```

Validation rules:

- `sourceLocale` and `targetLocale` must be supported
- `sourceLocale` and `targetLocale` may differ
- `fields` must be a non-empty object
- field values must be strings
- empty string field values are allowed
- combined field content must not exceed `MAX_INPUT_CHARS`
- glossary keys and values must be strings when provided

---

### Translate Response

```ts
type TranslateResponse = {
  model: string;
  targetLocale: "de" | "en" | "th";
  fields: Record<string, string>;
  warnings: string[];
  durationMs: number;
};
```

Validation rules:

- translated fields must contain exactly the same keys as the request
- every translated field value must be a string
- no additional translated field keys are allowed
- warnings should describe non-fatal issues

In Phase 0.5, `POST /translate` validates authenticated request payloads and
input length, calls Ollama through the translation service and returns a
validated `TranslateResponse`.

The model is expected to return this wrapper shape:

```json
{
  "fields": {
    "title": "Contact"
  }
}
```

If the first model output is invalid JSON, is missing the `fields` wrapper, has
missing or extra translated field keys or includes non-string translated values,
the service performs exactly one repair attempt with the bounded repair prompt.
Provider errors such as `OLLAMA_TIMEOUT` and `OLLAMA_UNAVAILABLE` are not
repair-retried.

---

## Error Shape

Preferred structured error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

Common error codes:

```txt
UNAUTHORIZED
VALIDATION_ERROR
INPUT_TOO_LARGE
OLLAMA_UNAVAILABLE
OLLAMA_TIMEOUT
OLLAMA_INVALID_RESPONSE
MODEL_OUTPUT_INVALID
INTERNAL_ERROR
```

---

## Prompt Strategy

Initial system prompt:

```txt
You are a translation engine. Translate the provided JSON fields from the source locale to the target locale.

Rules:
- Translate meaning, not word by word.
- Preserve factual meaning exactly.
- Use natural target-language syntax.
- Do not add or remove claims.
- Return valid JSON only.
- Preserve all field names exactly.
- Do not add explanations.
- Do not translate glossary terms unless explicitly mapped.
- Preserve Markdown syntax.
- Preserve code blocks, URLs, placeholders, variable names and product names.
- Keep the tone consistent with the requested tone.
```

The model should be asked to return only the translated `fields` object or a
document with a clearly defined JSON shape. The service must parse and validate
the result before returning it.

---

## Retry and Repair Strategy

Retry behavior:

```txt
attempt 1: normal translation prompt
attempt 2: repair prompt if JSON parsing failed or required keys are missing
```

No endless retry loop and no background queue exists.

Repair prompt should include:

- the expected field keys
- the malformed output if safe and bounded
- the instruction to return valid JSON only

If repair fails, the service returns `MODEL_OUTPUT_INVALID`.

---

## Stateless Design

The service should not use a database in the first version.

Reasons:

- the consuming application already owns translation records
- workflow state belongs to the consuming application
- stateless requests are simpler to test and deploy
- retry/queue persistence can be added later only if needed

---

## Future Queue Option

A queue may be added later if translation calls become too slow for direct admin
actions.

Possible future direction:

```txt
POST /translate-jobs
GET /translate-jobs/:id
```

This is out of scope until direct synchronous translation proves insufficient.

---

## Security Architecture

Security model:

```txt
private network + API key
```

Rules:

- service must not be public
- no Cloudflare route by default
- no public Nginx Proxy Manager route by default
- API key required for translation
- health may remain internal unauthenticated
- no raw source text logging by default
- no permanent raw AI request/response storage
- input length limit required
- timeout required
- generated output must require review in the consuming application

---

## Docker Architecture

Expected service:

```txt
ai-translation-service
```

Internal port:

```txt
4100
```

The Docker image builds the TypeScript project and runs `dist/server.js` with
production dependencies installed through `npm ci --omit=dev`.

The Compose baseline:

- uses service and container name `ai-translation-service`
- restarts with `unless-stopped`
- defaults `NODE_ENV` to `production`
- publishes `127.0.0.1:4100:4100` for local testing
- reads environment values from Compose interpolation with safe defaults
- includes no database service
- includes no queue service
- includes no public reverse proxy labels

If Ollama runs on host:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

If Ollama runs in Docker, the service should connect through the Docker network
to the Ollama container.

The service remains stateless. `/translate` performs a synchronous Ollama call
through the translation service, with at most one synchronous repair attempt for
malformed model output. No database or queue is used.

Runtime smoke checks are documented in `docs/runtime-smoke-checklist.md`.
Live Ollama checks are manual runtime checks; automated tests use mocked
provider behavior.

Prompt-quality findings from manual model tests are documented in
`docs/model-evaluation-notes.md`. Current empirical guidance is
`aya-expanse:8b` for better translation quality and `qwen2.5:7b` as a fast
fallback. These notes do not change the API contract or service boundary.

Client integration planning is documented in
`docs/client-integration-contract.md`, with example request payloads under
`docs/examples/` and readiness notes in `docs/service-readiness-review.md`.
The service remains stateless and integration-ready: it returns translated
fields to the caller but does not store data, mutate downstream records or
publish content.

---

## Testing Strategy

Tests are required from the beginning. Every implementation phase should add or
update tests for the behavior introduced in that phase.

Initial test stack:

```txt
Vitest
Fastify inject or lightweight route-level tests
Mocked Ollama client/provider behavior
```

Initial test priorities:

- config validation
- API key middleware
- health route
- translate request validation
- max input length behavior
- prompt builder output
- translated field key validation
- mocked Ollama success response
- mocked invalid JSON response
- mocked timeout/provider error

CI and normal development checks should use mocked Ollama responses and must not require a live model.

Live Ollama smoke checks may exist as manual local commands only.

---

## Integration With Client Applications

Expected client application environment variables:

```env
TRANSLATION_SERVICE_URL=http://ai-translation-service:4100
TRANSLATION_SERVICE_API_KEY=change-me
```

Expected future API flow:

```txt
Admin clicks "Generate Translation"
  -> client API validates source entity and target locale
  -> client API calls ai-translation-service
  -> service returns translated fields
  -> client application stores record as machine
  -> admin reviews
  -> admin sets reviewed/published when acceptable
```

The consuming application must not publish machine output automatically.

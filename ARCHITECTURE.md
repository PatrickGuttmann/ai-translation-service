# Architecture

## Overview

`ai-translation-service` is a small internal service for structured AI-assisted
translation.

It is designed as a separate runtime from `patrick-dev-site`. The website owns
content and translation records. This service only receives structured fields,
translates them through Ollama and returns structured output.

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
patrick-dev-site Admin UI
   |
   v
patrick-dev-site API
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

### `patrick-dev-site`

Responsible for:

- source content management
- Translation database tables
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

- website database writes
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
- return the Phase 0.1 placeholder response
- return structured errors

Future responsibilities:

- validate request body
- call translation service

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
- select prompt template
- call Ollama client
- parse response
- validate translated fields
- retry repair where allowed
- assemble warnings and duration metadata

---

### `src/ollama/`

Contains all Ollama-specific HTTP behavior.

Responsibilities:

- call Ollama `/api/chat` or `/api/generate`
- apply request timeout
- return model output text
- normalize provider errors
- avoid leaking full source text in logs

No route should call Ollama directly.

---

### `src/prompts/`

Contains server-owned prompt templates.

Initial prompt goals:

- force JSON-only output
- preserve field names
- preserve Markdown, URLs, placeholders and code
- respect glossary mappings
- keep tone consistent
- prohibit explanations outside JSON

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
MODEL_OUTPUT_INVALID
TRANSLATION_FAILED
INTERNAL_ERROR
```

---

## Prompt Strategy

Initial system prompt:

```txt
You are a translation engine. Translate the provided JSON fields from the source locale to the target locale.

Rules:
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

Initial retry behavior:

```txt
attempt 1: normal translation prompt
attempt 2: repair prompt if JSON parsing failed or required keys are missing
```

No endless retry loop.

Repair prompt should include:

- the expected field keys
- the malformed output if safe and bounded
- the instruction to return valid JSON only

If repair fails, the service returns `MODEL_OUTPUT_INVALID` or
`TRANSLATION_FAILED`.

---

## Stateless Design

The service should not use a database in the first version.

Reasons:

- `patrick-dev-site` already owns translation records
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

The service remains stateless in Phase 0.1 and does not perform live Ollama
translation yet.

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

## Integration with `patrick-dev-site`

Expected future environment variables in `patrick-dev-site`:

```env
TRANSLATION_SERVICE_URL=http://ai-translation-service:4100
TRANSLATION_SERVICE_API_KEY=change-me
```

Expected future API flow:

```txt
Admin clicks "Generate Translation"
  -> patrick-dev-site API validates source entity and target locale
  -> patrick-dev-site API calls ai-translation-service
  -> service returns translated fields
  -> patrick-dev-site stores record as machine
  -> admin reviews
  -> admin sets reviewed/published when acceptable
```

The website must not publish machine output automatically.

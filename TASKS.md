# Tasks

This file tracks planned implementation tasks for `ai-translation-service`.

The goal is to keep work small, sequential and easy for AI coding agents such as
Codex to execute.

---

## Task Status Legend

```txt
[ ] Not started
[/] In progress
[x] Done
[!] Blocked
```

---

## Current Phase

```txt
Phase: 0.3
Goal: Ollama Client
Status: Complete
```

---

# Phase 0.1 — Service Foundation

Goal:

```txt
Create the minimal internal Fastify/TypeScript service foundation.
```

Scope:

```txt
Node.js
TypeScript
Fastify
Zod
API key middleware
GET /health
placeholder POST /translate
environment config
Docker/Portainer baseline
documentation
```

Out of scope:

```txt
real Ollama calls
prompt templates
translation parsing
retry/repair
database
queue
public frontend
website integration
```

---

## 0.1.1 — Initialize Node TypeScript Project

```txt
Status: [x]
Priority: High
```

Create the base Node/TypeScript project.

Required files:

```txt
package.json
tsconfig.json
src/server.ts
src/app.ts
```

Required scripts:

```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc -p tsconfig.json",
  "start": "node dist/server.js",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Acceptance criteria:

```txt
[x] package.json exists
[x] TypeScript is configured in strict mode
[x] src/server.ts exists
[x] src/app.ts exists
[x] npm install works
[x] npm run typecheck works
[x] npm test works
[x] npm run build works
```

---

## 0.1.2 — Add Environment Configuration

```txt
Status: [x]
Priority: High
```

Add environment configuration.

Required variables:

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

Suggested file:

```txt
src/config.ts
```

Acceptance criteria:

```txt
[x] configuration is loaded from process.env
[x] required values are validated
[x] invalid config fails fast
[x] safe defaults exist where appropriate
[x] no real secrets are committed
```

---

## 0.1.3 — Add Fastify App and Health Route

```txt
Status: [x]
Priority: High
```

Implement the basic Fastify app and health route.

Required route:

```txt
GET /health
```

Expected response:

```json
{
  "status": "ok",
  "service": "ai-translation-service"
}
```

Suggested files:

```txt
src/app.ts
src/routes/health.routes.ts
```

Acceptance criteria:

```txt
[x] Fastify app is created in src/app.ts
[x] health route exists
[x] GET /health returns status ok
[x] response shape is stable
[x] health route does not require Ollama
```

---

## 0.1.4 — Add Test Baseline

```txt
Status: [x]
Priority: High
```

Add the test framework before implementing more behavior.

Required stack:

```txt
Vitest
Fastify inject or lightweight route-level tests
mocked dependencies where needed
```

Suggested files:

```txt
vitest.config.ts
src/routes/health.routes.test.ts
```

Acceptance criteria:

```txt
[x] Vitest is installed
[x] npm test script exists
[x] npm run test:watch script exists
[x] first health route test exists
[x] tests do not require live Ollama
[x] tests do not require Docker
[x] npm test passes
```

---

## 0.1.5 — Add API Key Middleware

```txt
Status: [x]
Priority: High
```

Add protection for internal write/translation routes.

Expected header:

```txt
Authorization: Bearer <API_KEY>
```

Suggested file:

```txt
src/security/api-key.ts
```

Acceptance criteria:

```txt
[x] valid API key is accepted
[x] missing API key is rejected
[x] invalid API key is rejected
[x] rejected requests return structured 401
[x] API key is never logged
[x] middleware tests cover missing, invalid and valid key behavior
```

---

## 0.1.6 — Add Placeholder Translate Route

```txt
Status: [x]
Priority: High
```

Add a protected placeholder translation route.

Required route:

```txt
POST /translate
```

Temporary response:

```json
{
  "status": "not_implemented"
}
```

Suggested file:

```txt
src/routes/translate.routes.ts
```

Acceptance criteria:

```txt
[x] route exists
[x] route requires API key
[x] unauthenticated requests fail
[x] authenticated requests return placeholder response
[x] route tests cover unauthenticated and authenticated behavior
[x] no Ollama call is added yet
```

---

## 0.1.7 — Add Error Response Baseline

```txt
Status: [x]
Priority: Medium
```

Add a small structured error response helper or convention.

Preferred shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

Acceptance criteria:

```txt
[x] unauthorized errors use structured shape
[x] unexpected errors use safe structured shape
[x] stack traces are not exposed in production responses
[x] error codes are stable enough for callers
[x] error response tests cover at least unauthorized and unexpected error paths where practical
```

---

## 0.1.8 — Add Docker Baseline

```txt
Status: [x]
Priority: High
```

Add Docker support for local/Portainer deployment.

Required files:

```txt
Dockerfile
docker-compose.yml
.dockerignore
```

Service expectations:

```txt
service name: ai-translation-service
internal port: 4100
restart: unless-stopped
no public reverse proxy labels
```

Acceptance criteria:

```txt
[x] Dockerfile exists
[x] docker-compose.yml exists
[x] docker compose config passes
[x] service exposes only the intended local/internal port
[x] environment variables are used
[x] no public reverse proxy labels are added
```

---

## 0.1.9 — Add Environment Example

```txt
Status: [x]
Priority: High
```

Add `.env.example`.

Expected content:

```env
NODE_ENV=development
PORT=4100

API_KEY=DEV_SECRET_CHANGE_ME

OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=qwen2.5:7b

REQUEST_TIMEOUT_MS=60000
MAX_INPUT_CHARS=12000

LOG_LEVEL=info
```

Acceptance criteria:

```txt
[x] .env.example exists
[x] all required variables are documented
[x] no real secrets are included
[x] Docker Compose variables match the example
```

---

## 0.1.10 — Add Documentation Baseline

```txt
Status: [x]
Priority: High
```

Add and align base documentation.

Required files:

```txt
README.md
ARCHITECTURE.md
AGENTS.md
TASKS.md
```

Acceptance criteria:

```txt
[x] README explains purpose, setup, API and local smoke checks
[x] ARCHITECTURE explains service boundary and module responsibilities
[x] AGENTS defines AI coding rules and forbidden early additions
[x] TASKS tracks phases and next work
[x] documents do not contradict each other
```

---

## 0.1.11 — Verify Service Foundation

```txt
Status: [x]
Priority: High
```

Run available checks after implementing Phase 0.1.

Expected checks:

```bash
npm install
npm run typecheck
npm test
npm run build
docker compose config
```

Manual route checks:

```bash
curl -i http://localhost:4100/health

curl -i -X POST http://localhost:4100/translate \
  -H "Content-Type: application/json" \
  -d '{}'

curl -i -X POST http://localhost:4100/translate \
  -H "Authorization: Bearer DEV_SECRET_CHANGE_ME" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Acceptance criteria:

```txt
[x] typecheck passes
[x] tests pass
[x] build passes
[x] docker compose config passes
[x] GET /health works locally
[x] POST /translate rejects missing API key
[x] POST /translate accepts valid API key
[x] Phase 0.1 can be marked complete
```

---

# Phase 0.2 — Translation Contract and Validation

Goal:

```txt
Define and validate the structured translation API contract before real model calls.
```

---

## 0.2.1 — Define Translation Types and Schemas

```txt
Status: [x]
Priority: High
```

Add translation request/response schemas and types.

Suggested files:

```txt
src/translation/translate.schema.ts
src/translation/translate.types.ts
```

Initial request fields:

```txt
sourceLocale
targetLocale
contentType
fields
tone
glossary
```

Acceptance criteria:

```txt
[x] sourceLocale supports de, en, th
[x] targetLocale supports de, en, th
[x] contentType supports managed-page, managed-page-section, project, devlog, generic
[x] fields is a non-empty record of strings
[x] tone is optional and bounded
[x] glossary is optional and string-to-string
[x] request type is inferred from Zod schema or kept aligned
```

---

## 0.2.2 — Enforce Max Input Length

```txt
Status: [x]
Priority: High
```

Reject oversized translation requests before calling any model.

Acceptance criteria:

```txt
[x] combined input field length is calculated
[x] MAX_INPUT_CHARS is enforced
[x] oversized input returns INPUT_TOO_LARGE
[x] error response is structured
[x] no Ollama call happens when input is too large
```

---

## 0.2.3 — Validate Field Key Preservation

```txt
Status: [x]
Priority: High
```

Add validation helper for translated model output.

Acceptance criteria:

```txt
[x] translated output must contain exactly the same keys as input
[x] missing keys are detected
[x] extra keys are detected
[x] non-string field values are rejected
[x] validation returns useful error details for retry/repair
```

---

## 0.2.4 — Add Contract Tests

```txt
Status: [x]
Priority: Medium
```

Add tests for schema and validation behavior.

Acceptance criteria:

```txt
[x] valid translate request passes
[x] missing fields request fails
[x] unsupported locale fails
[x] oversized input fails
[x] translated missing key fails
[x] translated extra key fails
[x] translated non-string value fails
```

---

# Phase 0.3 — Ollama Client

Goal:

```txt
Add isolated Ollama HTTP communication without mixing provider logic into routes.
```

---

## 0.3.1 — Add Ollama Client

```txt
Status: [x]
Priority: High
```

Implement an Ollama HTTP client.

Suggested file:

```txt
src/ollama/ollama.client.ts
```

Acceptance criteria:

```txt
[x] client uses OLLAMA_BASE_URL
[x] client uses OLLAMA_MODEL
[x] client supports configured timeout
[x] client returns model output text
[x] provider errors are normalized
[x] routes do not call Ollama directly
```

---

## 0.3.2 — Add Ollama Response Schema

```txt
Status: [x]
Priority: Medium
```

Validate the relevant parts of the Ollama response.

Suggested file:

```txt
src/ollama/ollama.schema.ts
```

Acceptance criteria:

```txt
[x] expected Ollama response shape is parsed safely
[x] missing output text is handled as provider error
[x] unexpected provider response does not crash route handling
```

---

## 0.3.3 — Add Mocked Ollama Tests

```txt
Status: [x]
Priority: Medium
```

Test Ollama client behavior without requiring a live model.

Acceptance criteria:

```txt
[x] successful mocked response returns text
[x] timeout is handled
[x] connection failure is handled
[x] invalid provider response is handled
[x] tests do not require live Ollama
```

---

# Phase 0.4 — Prompt Templates

Goal:

```txt
Add controlled server-owned prompt templates for predictable translation behavior.
```

---

## 0.4.1 — Add Translation Prompt Template

```txt
Status: [ ]
Priority: High
```

Add the first translation prompt template.

Suggested files:

```txt
src/prompts/templates.ts
src/prompts/prompt-builder.ts
```

Acceptance criteria:

```txt
[ ] prompt instructs JSON-only output
[ ] prompt instructs exact field-key preservation
[ ] prompt instructs glossary handling
[ ] prompt instructs Markdown/code/URL/placeholder preservation
[ ] prompt includes sourceLocale and targetLocale
[ ] prompt includes tone when provided
```

---

## 0.4.2 — Add Repair Prompt Template

```txt
Status: [ ]
Priority: High
```

Add a bounded repair prompt for invalid model output.

Acceptance criteria:

```txt
[ ] repair prompt asks for valid JSON only
[ ] expected field keys are listed
[ ] malformed output is bounded before inclusion
[ ] repair prompt does not expose secrets
[ ] repair prompt is used only after first failure
```

---

## 0.4.3 — Add Prompt Builder Tests

```txt
Status: [ ]
Priority: Medium
```

Test prompt generation.

Acceptance criteria:

```txt
[ ] prompt contains locales
[ ] prompt contains field keys
[ ] prompt contains glossary when provided
[ ] prompt contains JSON-only instruction
[ ] prompt does not mutate input payload
```

---

# Phase 0.5 — Real Translation Endpoint

Goal:

```txt
Connect validation, prompt building, Ollama client and response parsing into POST /translate.
```

---

## 0.5.1 — Implement Translate Service

```txt
Status: [ ]
Priority: High
```

Implement the main translation orchestration.

Suggested file:

```txt
src/translation/translate.service.ts
```

Acceptance criteria:

```txt
[ ] validates request
[ ] enforces input length
[ ] builds prompt
[ ] calls Ollama client
[ ] parses model JSON output
[ ] validates translated fields
[ ] returns model, targetLocale, fields, warnings and durationMs
```

---

## 0.5.2 — Wire POST /translate to Translate Service

```txt
Status: [ ]
Priority: High
```

Replace placeholder behavior with real translation behavior.

Acceptance criteria:

```txt
[ ] POST /translate accepts valid structured request
[ ] route calls TranslateService
[ ] successful response matches TranslateResponse schema
[ ] invalid requests return structured validation errors
[ ] provider failures return structured safe errors
```

---

## 0.5.3 — Add JSON Parse Handling

```txt
Status: [ ]
Priority: High
```

Handle model output parsing safely.

Acceptance criteria:

```txt
[ ] valid JSON output is parsed
[ ] fenced JSON output can be handled if implemented deliberately
[ ] invalid JSON does not crash the service
[ ] invalid JSON produces retry/repair path or structured failure
```

---

## 0.5.4 — Add Integration Tests with Mocked Ollama

```txt
Status: [ ]
Priority: High
```

Test the full translation route with mocked provider behavior.

Acceptance criteria:

```txt
[ ] valid request returns translated fields
[ ] unauthenticated request returns 401
[ ] invalid request returns validation error
[ ] oversized request returns INPUT_TOO_LARGE
[ ] mocked provider failure returns safe error
[ ] live Ollama is not required
```

---

# Phase 0.6 — Retry and Repair

Goal:

```txt
Make malformed model output recoverable without adding a queue or endless retries.
```

---

## 0.6.1 — Retry Invalid JSON Once

```txt
Status: [ ]
Priority: Medium
```

Retry once when model output is not parseable JSON.

Acceptance criteria:

```txt
[ ] invalid JSON triggers one repair attempt
[ ] second invalid JSON fails safely
[ ] warnings include repair attempt info
[ ] no infinite retry loop exists
```

---

## 0.6.2 — Retry Missing or Extra Fields Once

```txt
Status: [ ]
Priority: Medium
```

Retry once when translated keys do not match requested keys.

Acceptance criteria:

```txt
[ ] missing key triggers repair attempt
[ ] extra key triggers repair attempt
[ ] non-string value triggers repair attempt
[ ] second invalid output fails safely
[ ] warnings describe repair behavior
```

---

## 0.6.3 — Add Duration and Warning Metadata

```txt
Status: [ ]
Priority: Medium
```

Ensure responses include useful metadata.

Acceptance criteria:

```txt
[ ] durationMs is measured
[ ] model name is returned
[ ] warnings array exists for all success responses
[ ] repair warnings are represented
[ ] non-fatal normalization warnings can be added later
```

---

## 0.6.4 — Review Retry Boundaries

```txt
Status: [ ]
Priority: Low
```

Review retry behavior before adding more advanced job handling.

Acceptance criteria:

```txt
[ ] retry count is bounded
[ ] failure modes are documented
[ ] queue/background processing remains deferred
[ ] no database is added
```

---

# Phase 0.7 — Docker / Portainer Runtime

Goal:

```txt
Make the service easy to deploy internally with Docker and Portainer.
```

---

## 0.7.1 — Review Dockerfile for Production Runtime

```txt
Status: [ ]
Priority: Medium
```

Acceptance criteria:

```txt
[ ] image builds
[ ] production image runs compiled code
[ ] dev dependencies are not required at runtime
[ ] service listens on configured port
[ ] no secrets are baked into image
```

---

## 0.7.2 — Review Portainer Stack Shape

```txt
Status: [ ]
Priority: Medium
```

Acceptance criteria:

```txt
[ ] docker-compose.yml is Portainer-compatible
[ ] environment variables are clear
[ ] service is not publicly reverse-proxied
[ ] Ollama host/container access is documented
[ ] restart policy is set
```

---

## 0.7.3 — Add Runtime Smoke Checklist

```txt
Status: [ ]
Priority: Medium
```

Document post-deployment checks.

Acceptance criteria:

```txt
[ ] health check command is documented
[ ] unauthorized translate check is documented
[ ] authorized translate check is documented
[ ] Ollama connectivity check is documented
[ ] failure expectations are documented
```

---

# Phase 0.8 — Website Integration Preparation

Goal:

```txt
Prepare the integration contract for patrick-dev-site without implementing website changes here.
```

---

## 0.8.1 — Document Website Client Contract

```txt
Status: [ ]
Priority: High
```

Document how `patrick-dev-site` should call the service.

Expected future website environment variables:

```env
TRANSLATION_SERVICE_URL=http://ai-translation-service:4100
TRANSLATION_SERVICE_API_KEY=change-me
```

Acceptance criteria:

```txt
[ ] request/response examples are documented
[ ] auth header is documented
[ ] error handling expectations are documented
[ ] machine status workflow expectation is documented
[ ] no website code is changed in this repository
```

---

## 0.8.2 — Add Example Website Payloads

```txt
Status: [ ]
Priority: Medium
```

Add examples for the first content types.

Acceptance criteria:

```txt
[ ] managed page example exists
[ ] managed page section example exists
[ ] project example exists
[ ] Devlog example exists
[ ] Thai target example exists
```

---

## 0.8.3 — Final Service Readiness Review

```txt
Status: [ ]
Priority: Medium
```

Review service readiness before integrating into `patrick-dev-site`.

Acceptance criteria:

```txt
[ ] API contract is stable enough for a website client
[ ] security boundary is documented
[ ] model/output failure behavior is documented
[ ] tests cover mocked provider behavior
[ ] live Ollama smoke path is documented
[ ] no database or queue was added prematurely
```

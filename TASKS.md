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
Phase: 0.9
Goal: Translation Quality Prompt Refinement
Status: Complete
Initial service foundation: Integration-ready
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
client integration
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
Status: [x]
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
[x] prompt instructs JSON-only output
[x] prompt instructs exact field-key preservation
[x] prompt instructs glossary handling
[x] prompt instructs Markdown/code/URL/placeholder preservation
[x] prompt includes sourceLocale and targetLocale
[x] prompt includes tone when provided
```

---

## 0.4.2 — Add Repair Prompt Template

```txt
Status: [x]
Priority: High
```

Add a bounded repair prompt for invalid model output.

Acceptance criteria:

```txt
[x] repair prompt asks for valid JSON only
[x] expected field keys are listed
[x] malformed output is bounded before inclusion
[x] repair prompt does not expose secrets
[x] repair prompt is used only after first failure
```

---

## 0.4.3 — Add Prompt Builder Tests

```txt
Status: [x]
Priority: Medium
```

Test prompt generation.

Acceptance criteria:

```txt
[x] prompt contains locales
[x] prompt contains field keys
[x] prompt contains glossary when provided
[x] prompt contains JSON-only instruction
[x] prompt does not mutate input payload
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
Status: [x]
Priority: High
```

Implement the main translation orchestration.

Suggested file:

```txt
src/translation/translate.service.ts
```

Acceptance criteria:

```txt
[x] validates request
[x] enforces input length
[x] builds prompt
[x] calls Ollama client
[x] parses model JSON output
[x] validates translated fields
[x] returns model, targetLocale, fields, warnings and durationMs
```

---

## 0.5.2 — Wire POST /translate to Translate Service

```txt
Status: [x]
Priority: High
```

Replace placeholder behavior with real translation behavior.

Acceptance criteria:

```txt
[x] POST /translate accepts valid structured request
[x] route calls TranslateService
[x] successful response matches TranslateResponse schema
[x] invalid requests return structured validation errors
[x] provider failures return structured safe errors
```

---

## 0.5.3 — Add JSON Parse Handling

```txt
Status: [x]
Priority: High
```

Handle model output parsing safely.

Acceptance criteria:

```txt
[x] valid JSON output is parsed
[x] fenced JSON output can be handled if implemented deliberately
[x] invalid JSON does not crash the service
[x] invalid JSON produces retry/repair path or structured failure
```

---

## 0.5.4 — Add Integration Tests with Mocked Ollama

```txt
Status: [x]
Priority: High
```

Test the full translation route with mocked provider behavior.

Acceptance criteria:

```txt
[x] valid request returns translated fields
[x] unauthenticated request returns 401
[x] invalid request returns validation error
[x] oversized request returns INPUT_TOO_LARGE
[x] mocked provider failure returns safe error
[x] live Ollama is not required
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
Status: [x]
Priority: Medium
```

Retry once when model output is not parseable JSON.

Acceptance criteria:

```txt
[x] invalid JSON triggers one repair attempt
[x] second invalid JSON fails safely
[x] warnings include repair attempt info
[x] no infinite retry loop exists
```

---

## 0.6.2 — Retry Missing or Extra Fields Once

```txt
Status: [x]
Priority: Medium
```

Retry once when translated keys do not match requested keys.

Acceptance criteria:

```txt
[x] missing key triggers repair attempt
[x] extra key triggers repair attempt
[x] non-string value triggers repair attempt
[x] second invalid output fails safely
[x] warnings describe repair behavior
```

---

## 0.6.3 — Add Duration and Warning Metadata

```txt
Status: [x]
Priority: Medium
```

Ensure responses include useful metadata.

Acceptance criteria:

```txt
[x] durationMs is measured
[x] model name is returned
[x] warnings array exists for all success responses
[x] repair warnings are represented
[x] non-fatal normalization warnings can be added later
```

---

## 0.6.4 — Review Retry Boundaries

```txt
Status: [x]
Priority: Low
```

Review retry behavior before adding more advanced job handling.

Acceptance criteria:

```txt
[x] retry count is bounded
[x] failure modes are documented
[x] queue/background processing remains deferred
[x] no database is added
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
Status: [x]
Priority: Medium
```

Acceptance criteria:

```txt
[x] image builds
[x] production image runs compiled code
[x] dev dependencies are not required at runtime
[x] service listens on configured port
[x] no secrets are baked into image
```

---

## 0.7.2 — Review Portainer Stack Shape

```txt
Status: [x]
Priority: Medium
```

Acceptance criteria:

```txt
[x] docker-compose.yml is Portainer-compatible
[x] environment variables are clear
[x] service is not publicly reverse-proxied
[x] Ollama host/container access is documented
[x] restart policy is set
```

---

## 0.7.3 — Add Runtime Smoke Checklist

```txt
Status: [x]
Priority: Medium
```

Document post-deployment checks.

Acceptance criteria:

```txt
[x] health check command is documented
[x] unauthorized translate check is documented
[x] authorized translate check is documented
[x] Ollama connectivity check is documented
[x] failure expectations are documented
```

---

# Phase 0.8 — Client Integration Preparation

Goal:

```txt
Prepare the integration contract for consuming applications without implementing client changes here.
```

---

## 0.8.1 — Document Client Integration Contract

```txt
Status: [x]
Priority: High
```

Document how a consuming application should call the service.

Expected future client environment variables:

```env
TRANSLATION_SERVICE_URL=http://ai-translation-service:4100
TRANSLATION_SERVICE_API_KEY=change-me
```

Acceptance criteria:

```txt
[x] request/response examples are documented
[x] auth header is documented
[x] error handling expectations are documented
[x] machine status workflow expectation is documented
[x] no client application code is changed in this repository
```

---

## 0.8.2 — Add Example Client Payloads

```txt
Status: [x]
Priority: Medium
```

Add examples for the first content types.

Acceptance criteria:

```txt
[x] managed page example exists
[x] managed page section example exists
[x] project example exists
[x] Devlog example exists
[x] Thai target example exists
```

---

## 0.8.3 — Final Service Readiness Review

```txt
Status: [x]
Priority: Medium
```

Review service readiness before integrating into a consuming application.

Acceptance criteria:

```txt
[x] API contract is stable enough for a client application
[x] security boundary is documented
[x] model/output failure behavior is documented
[x] tests cover mocked provider behavior
[x] live Ollama smoke path is documented
[x] no database or queue was added prematurely
```

---

# Phase 0.9 — Translation Quality Prompt Refinement

Goal:

```txt
Improve translation quality through prompt refinement and documented model observations without changing the API contract.
```

---

## 0.9.1 — Plan Prompt Quality Refinement

```txt
Status: [x]
Priority: Medium
```

Acceptance criteria:

```txt
[x] observed weaknesses are documented
[x] quality goals are defined
[x] API contract remains stable
```

---

## 0.9.2 — Refine Translation Prompt

```txt
Status: [x]
Priority: High
```

Acceptance criteria:

```txt
[x] meaning-preserving translation instructions are added
[x] literal idiom translation is discouraged
[x] natural target-language wording is required
[x] factual meaning must be preserved
[x] adding or removing claims is forbidden
[x] JSON-only output and exact field keys remain required
```

---

## 0.9.3 — Refine Tone Guidance

```txt
Status: [x]
Priority: Medium
```

Acceptance criteria:

```txt
[x] supported tones are clarified
[x] tone may influence wording without changing facts
[x] personal-technical tone stays clear, natural and not marketing-heavy
```

---

## 0.9.4 — Add Prompt Quality Tests

```txt
Status: [x]
Priority: Medium
```

Acceptance criteria:

```txt
[x] prompt includes meaning-preserving instruction
[x] prompt discourages literal idiom translation
[x] prompt requires natural target-language syntax
[x] prompt forbids adding or removing claims
[x] prompt preserves JSON-only output and exact field keys
```

---

## 0.9.5 — Document Runtime Model Findings

```txt
Status: [x]
Priority: Medium
```

Acceptance criteria:

```txt
[x] aya-expanse:8b observations are documented
[x] qwen2.5:7b observations are documented
[x] gemma3:12b observations are documented
[x] default and fallback recommendations are documented
[x] findings are described as empirical and environment-specific
```

---

## 0.9.6 — Final Prompt Quality Review

```txt
Status: [x]
Priority: Medium
```

Acceptance criteria:

```txt
[x] no API, schema or runtime architecture change was made
[x] tests pass
[x] automated tests do not require live Ollama
```

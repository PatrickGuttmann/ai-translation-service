# Service Readiness Review

`ai-translation-service` is ready for client integration planning after Phase
0.8. This review summarizes the implemented foundation and the remaining
boundaries before downstream application integration work begins.

## Implemented Phases

- Phase 0.1: Fastify/TypeScript foundation, config validation, health route,
  API key middleware, translate route baseline, tests and Docker baseline.
- Phase 0.2: translation request/response schemas, input length validation,
  translated field key preservation and contract tests.
- Phase 0.3: isolated Ollama client, Ollama response validation and mocked
  provider tests.
- Phase 0.4: server-owned translation and repair prompt templates.
- Phase 0.5: synchronous translation service wired to `POST /translate`.
- Phase 0.6: one bounded repair retry, warning metadata and duration metadata.
- Phase 0.7: Docker/Portainer runtime review and smoke checklist.
- Phase 0.8: client integration contract, example client payloads and readiness
  documentation.

## API Contract Status

The integration contract is documented in
`docs/client-integration-contract.md`. `POST /translate` accepts structured fields,
requires an internal API key and returns a validated response with translated
fields, model name, target locale, warnings and duration.

The current contract is stable enough for client integration planning. Client
code should still treat provider and model-output errors as retryable or
reviewable failures rather than publication-ready content.

## Security Boundary

The service remains internal-only:

- no public frontend
- no public reverse proxy labels
- no browser-facing translation API
- API key required for `POST /translate`
- `GET /health` unauthenticated for private-network health checks
- no full source text or full model response logging by default

Generated translations must be stored as machine output and reviewed by a human
before any reviewed or published workflow state.

## Docker And Portainer Status

The Docker runtime builds TypeScript and runs compiled `dist/server.js` with
production dependencies. `docker-compose.yml` uses the service and container
name `ai-translation-service`, publishes `127.0.0.1:4100:4100` for local
testing and includes host Ollama access through `host.docker.internal`.

The runtime smoke path is documented in
`docs/runtime-smoke-checklist.md`.

## Test Coverage Status

Automated tests use Vitest and mocked provider behavior. They cover health,
API-key protection, request validation, input length validation, prompt
building, Ollama client behavior, mocked translation success and failure paths,
model-output validation and bounded repair behavior.

Automated tests do not require Docker, a database, network access or a live
Ollama model.

## Live Ollama Smoke Path

Live Ollama verification remains manual. Use the Docker/Portainer runtime smoke
checklist after configuring a real internal `API_KEY`, ensuring Ollama is
reachable and pulling the selected model if needed.

## Known Limitations And Deferred Items

- no queue or background jobs
- no database
- no translation memory
- no glossary management
- no public UI
- no direct client application integration yet
- no automatic publishing
- no legal text automation by default
- one bounded repair attempt only
- live translation quality still depends on the selected Ollama model

These limitations are deliberate for the first internal integration slice.

# Runtime Smoke Checklist

Use this checklist for local Docker Compose or Portainer stack verification.
Live Ollama checks are manual runtime checks and are not part of automated tests.

## Prerequisites

- Docker Compose is available.
- Ollama is running where the service can reach it.
- The service remains internal-only; do not add public reverse proxy,
  Cloudflare or Nginx Proxy Manager labels.
- No database or queue is required.

If Ollama runs on the Docker host, keep:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

Optionally pull the default local model:

```bash
ollama pull qwen2.5:7b
```

## Configure

Copy the example environment and set a real internal API key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
API_KEY=replace-with-a-private-internal-secret
```

Do not commit `.env`.

## Validate And Start

Render the Compose configuration:

```bash
docker compose config
```

Build the image:

```bash
docker compose build
```

Start the service:

```bash
docker compose up -d
```

Inspect logs:

```bash
docker compose logs -f ai-translation-service
```

## Smoke Checks

Health check:

```bash
curl -i http://localhost:4100/health
```

Expected status: `200 OK`

Unauthorized translate check:

```bash
curl -i -X POST http://localhost:4100/translate \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected status: `401 Unauthorized`

Authorized translate check:

```bash
curl -i -X POST http://localhost:4100/translate \
  -H "Authorization: Bearer replace-with-a-private-internal-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceLocale": "de",
    "targetLocale": "en",
    "contentType": "generic",
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

Expected successful response shape:

```json
{
  "model": "qwen2.5:7b",
  "targetLocale": "en",
  "fields": {
    "title": "Contact",
    "body": "Write to me if you have questions about my projects."
  },
  "warnings": [],
  "durationMs": 1234
}
```

If Ollama is unreachable, unavailable or times out, expect a structured provider
error such as `OLLAMA_UNAVAILABLE` or `OLLAMA_TIMEOUT`.

If the model returns malformed JSON and the one repair attempt also fails,
expect `MODEL_OUTPUT_INVALID`.

## Stop

Stop the service:

```bash
docker compose down
```

# Client Integration Contract

This document describes how an internal client application should call
`ai-translation-service`. It is an integration contract only; this repository
does not contain downstream application code.

## Client Environment

Expected client application environment variables:

```env
TRANSLATION_SERVICE_URL=http://ai-translation-service:4100
TRANSLATION_SERVICE_API_KEY=change-me
```

Use a private internal URL and a real secret outside source control. The service
must not be exposed as a public browser-facing API.

## Request

Endpoint:

```http
POST /translate
Authorization: Bearer <TRANSLATION_SERVICE_API_KEY>
Content-Type: application/json
```

Request body:

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

`fields` must contain only translatable text fields. Field keys are contract
keys and must not be translated.

## Curl Example

```bash
TRANSLATION_SERVICE_URL=http://localhost:4100
TRANSLATION_SERVICE_API_KEY=DEV_SECRET_CHANGE_ME

curl -i "$TRANSLATION_SERVICE_URL/translate" \
  -H "Authorization: Bearer $TRANSLATION_SERVICE_API_KEY" \
  -H "Content-Type: application/json" \
  --data @docs/examples/project.request.json
```

## Success Response

```ts
type TranslateResponse = {
  model: string;
  targetLocale: "de" | "en" | "th";
  fields: Record<string, string>;
  warnings: string[];
  durationMs: number;
};
```

Example:

```json
{
  "model": "qwen2.5:7b",
  "targetLocale": "en",
  "fields": {
    "title": "Contact",
    "body": "Write to us if you have questions about the documentation."
  },
  "warnings": [],
  "durationMs": 12400
}
```

If malformed model output is repaired successfully, `warnings` may include
`model_output_repaired`.

## Error Responses

Errors use this structured shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}
```

Relevant error codes:

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

Recommended client handling:

- `UNAUTHORIZED`: treat as an integration configuration problem.
- `VALIDATION_ERROR`: inspect the client-side payload builder.
- `INPUT_TOO_LARGE`: reduce selected fields or defer to a smaller request.
- `OLLAMA_UNAVAILABLE`: show retryable provider-unavailable feedback.
- `OLLAMA_TIMEOUT`: show retryable timeout feedback.
- `OLLAMA_INVALID_RESPONSE`: show retryable provider-response feedback.
- `MODEL_OUTPUT_INVALID`: show model-output failure feedback for manual retry.
- `INTERNAL_ERROR`: show generic failure feedback and inspect service logs.

## Client Responsibilities

The consuming application is responsible for:

- selecting the German source entity and fields
- sending only translatable text fields
- not sending slugs, routes, technical identifiers, stack/status values or
  admin-only fields
- storing returned output as machine translation
- never publishing machine output automatically
- requiring human review before `reviewed` or `published` status
- preserving `sourceUpdatedAt` or equivalent source freshness tracking
- deciding whether legal, privacy or imprint content is eligible for machine
  translation

Legal, privacy and imprint content should remain excluded by default until an
explicit review workflow exists.

## Service Responsibilities

`ai-translation-service` is responsible for:

- validating the request
- enforcing input length limits
- translating field values
- preserving field keys exactly
- retrying one bounded repair attempt for malformed model output
- returning structured success or error responses
- not storing request or response data

The service does not write to the consuming application's database and does not
decide workflow states.

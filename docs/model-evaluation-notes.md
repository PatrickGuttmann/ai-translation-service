# Model Evaluation Notes

These notes summarize manual runtime observations for local Ollama translation
quality. They are empirical, environment-specific findings rather than formal
benchmarks. Automated tests continue to use mocked provider behavior and do not
require live Ollama.

## Test Context

The observations came from synchronous `/translate` smoke checks using local
Ollama models. Shared GPU usage matters: when tools such as ComfyUI compete for
VRAM on an RTX 3070-class system, smaller models are preferred over 12B or 14B
models.

All model outputs remain machine drafts. A consuming application must require
human review before publishing translated content.

## Problematic Source Sentence

```txt
Punkt fuer Punkt erklaert: Das Rahmenabkommen mit dem Iran erfuellt kaum eine Forderung der USA Die von US-Praesident Donald Trump unterzeichnete Vereinbarung bleibt sowohl hinter dem Stand vor dem Krieg als auch weit hinter den oeffentlichen Forderungen der USA zurueck
```

Better English target meaning:

```txt
Point by point: The framework agreement with Iran meets hardly any of the United States' demands. The agreement signed by U.S. President Donald Trump falls short of both the pre-war status quo and the United States' public demands.
```

The important quality issue is preserving the comparison structure:

```txt
falls short of both X and Y
```

The translation should not turn this into an unrelated idiom or literal phrase.

## Observed Models

### `aya-expanse:8b`

- Produced better translation quality than `qwen2.5:7b` for the complex German
  journalistic sentence.
- Translated the comparison structure closer to the intended meaning, though
  the result was still somewhat stylistically imperfect.
- Observed duration was around 11 seconds for the tested payload.
- Current practical default recommendation when quality matters.

### `qwen2.5:7b`

- Faster and JSON-stable in the tested flow.
- Observed duration was around 5.8 seconds for the tested payload.
- Translated the complex sentence less accurately.
- Specifically mistranslated `bleibt sowohl hinter dem Stand vor dem Krieg...`
  as `behind the scenes before the war`.
- Current recommended fast fallback when latency matters more than quality.

### `gemma3:12b`

- Produced correct simple output.
- Was slow during shared GPU operation, with an observed duration around 24
  seconds for the sample payload.
- Larger models such as `gemma3:12b` and `qwen3:14b-q4_K_M` may still be
  useful when ComfyUI or other GPU workloads are not competing for VRAM.

## Current Recommendation

Use:

```env
OLLAMA_MODEL=aya-expanse:8b
```

when translation quality is the priority.

Use:

```env
OLLAMA_MODEL=qwen2.5:7b
```

as the fast fallback when lower latency and JSON stability matter more.

These recommendations should be revisited with the target deployment hardware,
typical payloads, and actual review feedback from translated drafts.

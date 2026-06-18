import { describe, expect, it } from "vitest";

import { type TranslateRequest } from "../translation/translate.types.js";
import { buildRepairMessages, buildTranslationMessages } from "./prompt-builder.js";

const request: TranslateRequest = {
  sourceLocale: "de",
  targetLocale: "en",
  contentType: "managed-page-section",
  fields: {
    title: "Kontakt",
    body: "Schreib mir..."
  },
  tone: "personal-technical",
  glossary: {
    API: "API",
    Ollama: "Ollama"
  }
};

function messageText(messages: { content: string }[]): string {
  return messages.map((message) => message.content).join("\n");
}

describe("buildTranslationMessages", () => {
  it("contains sourceLocale and targetLocale", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain('"sourceLocale": "de"');
    expect(text).toContain('"targetLocale": "en"');
  });

  it("contains contentType", () => {
    expect(messageText(buildTranslationMessages(request))).toContain('"contentType": "managed-page-section"');
  });

  it("contains field keys", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain('"title"');
    expect(text).toContain('"body"');
  });

  it("contains JSON-only instruction", () => {
    expect(messageText(buildTranslationMessages(request))).toContain("Return valid JSON only");
  });

  it("contains glossary terms when provided", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain('"API": "API"');
    expect(text).toContain('"Ollama": "Ollama"');
  });

  it("contains tone when provided", () => {
    expect(messageText(buildTranslationMessages(request))).toContain('"tone": "personal-technical"');
  });

  it("does not mutate the input request", () => {
    const original = structuredClone(request);

    buildTranslationMessages(request);

    expect(request).toEqual(original);
  });

  it("contains meaning-preserving translation instructions", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain("Translate meaning, not word by word");
    expect(text).toContain("Preserve factual meaning exactly");
  });

  it("discourages literal idiom translation", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain("Do not reinterpret idioms or fixed phrases literally");
  });

  it("requires natural target-language wording", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain("Use natural target-language syntax and wording");
    expect(text).toContain("journalistic or formal wording");
  });

  it("forbids adding or removing claims", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain("Do not add claims, remove claims, soften claims, or strengthen claims");
  });

  it("preserves exact JSON field key behavior", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain("Return valid JSON only");
    expect(text).toContain("Preserve all field names exactly");
    expect(text).toContain("Do not add new fields");
  });

  it("clarifies supported tone guidance without changing facts", () => {
    const text = messageText(buildTranslationMessages(request));

    expect(text).toContain("Keep tone consistent with the requested tone without changing facts");
    expect(text).toContain("For personal-technical tone, use clear, natural wording that is not marketing-heavy");
  });
});

describe("buildRepairMessages", () => {
  it("contains expected field keys", () => {
    const text = messageText(
      buildRepairMessages({
        expectedFieldKeys: ["title", "body"],
        invalidOutput: "{ nope"
      })
    );

    expect(text).toContain('"title"');
    expect(text).toContain('"body"');
  });

  it("contains JSON-only instruction", () => {
    const text = messageText(
      buildRepairMessages({
        expectedFieldKeys: ["title"],
        invalidOutput: "{ nope"
      })
    );

    expect(text).toContain("valid JSON only");
  });

  it("truncates very long invalid output", () => {
    const longOutput = "x".repeat(5000);
    const text = messageText(
      buildRepairMessages({
        expectedFieldKeys: ["title"],
        invalidOutput: longOutput
      })
    );

    expect(text).toContain("[truncated]");
    expect(text).not.toContain("x".repeat(4500));
  });

  it("preserves meaning during repair without simplifying claims", () => {
    const text = messageText(
      buildRepairMessages({
        expectedFieldKeys: ["title"],
        invalidOutput: "{ nope"
      })
    );

    expect(text).toContain("Preserve content meaning exactly");
    expect(text).toContain("Do not simplify, summarize, add claims, or remove claims during repair");
  });
});

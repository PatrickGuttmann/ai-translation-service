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
    Devlog: "Devlog",
    Alpendorf: "Alpendorf"
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

    expect(text).toContain('"Devlog": "Devlog"');
    expect(text).toContain('"Alpendorf": "Alpendorf"');
  });

  it("contains tone when provided", () => {
    expect(messageText(buildTranslationMessages(request))).toContain('"tone": "personal-technical"');
  });

  it("does not mutate the input request", () => {
    const original = structuredClone(request);

    buildTranslationMessages(request);

    expect(request).toEqual(original);
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
});

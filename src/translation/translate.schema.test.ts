import { describe, expect, it } from "vitest";

import { translateRequestSchema, translateResponseSchema } from "./translate.schema.js";

const validRequest = {
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

describe("translateRequestSchema", () => {
  it("accepts a valid translate request", () => {
    expect(translateRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("rejects a missing fields object", () => {
    const { fields: _fields, ...requestWithoutFields } = validRequest;

    expect(translateRequestSchema.safeParse(requestWithoutFields).success).toBe(false);
  });

  it("rejects an empty fields object", () => {
    expect(
      translateRequestSchema.safeParse({
        ...validRequest,
        fields: {}
      }).success
    ).toBe(false);
  });

  it("rejects an unsupported source locale", () => {
    expect(
      translateRequestSchema.safeParse({
        ...validRequest,
        sourceLocale: "fr"
      }).success
    ).toBe(false);
  });

  it("rejects an unsupported target locale", () => {
    expect(
      translateRequestSchema.safeParse({
        ...validRequest,
        targetLocale: "fr"
      }).success
    ).toBe(false);
  });

  it("rejects an unsupported content type", () => {
    expect(
      translateRequestSchema.safeParse({
        ...validRequest,
        contentType: "blog-post"
      }).success
    ).toBe(false);
  });

  it("rejects an invalid glossary", () => {
    expect(
      translateRequestSchema.safeParse({
        ...validRequest,
        glossary: {
          Devlog: 123
        }
      }).success
    ).toBe(false);
  });
});

describe("translateResponseSchema", () => {
  it("accepts a valid translate response", () => {
    expect(
      translateResponseSchema.safeParse({
        model: "qwen2.5:7b",
        targetLocale: "en",
        fields: {
          title: "Contact",
          body: "Write to me..."
        },
        warnings: [],
        durationMs: 1234
      }).success
    ).toBe(true);
  });
});

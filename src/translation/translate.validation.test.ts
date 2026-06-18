import { describe, expect, it } from "vitest";

import {
  calculateInputChars,
  validateInputLength,
  validateTranslatedFieldKeys
} from "./translate.validation.js";

describe("calculateInputChars", () => {
  it("calculates field and glossary character length", () => {
    expect(
      calculateInputChars({
        fields: {
          title: "abc",
          body: "defg"
        },
        glossary: {
          AI: "AI"
        }
      })
    ).toBe(11);
  });
});

describe("validateInputLength", () => {
  it("fails oversized input with INPUT_TOO_LARGE behavior", () => {
    const result = validateInputLength(
      {
        fields: {
          title: "Kontakt"
        }
      },
      3
    );

    expect(result).toEqual({
      ok: false,
      inputChars: 7,
      error: {
        error: {
          code: "INPUT_TOO_LARGE",
          message: "Input too large"
        }
      }
    });
  });
});

describe("validateTranslatedFieldKeys", () => {
  it("fails when translated output is missing a key", () => {
    const result = validateTranslatedFieldKeys(
      {
        title: "Kontakt",
        body: "Text"
      },
      {
        title: "Contact"
      }
    );

    expect(result).toEqual({
      ok: false,
      error: {
        missingKeys: ["body"],
        extraKeys: [],
        nonStringKeys: []
      }
    });
  });

  it("fails when translated output has an extra key", () => {
    const result = validateTranslatedFieldKeys(
      {
        title: "Kontakt"
      },
      {
        title: "Contact",
        slug: "contact"
      }
    );

    expect(result).toEqual({
      ok: false,
      error: {
        missingKeys: [],
        extraKeys: ["slug"],
        nonStringKeys: []
      }
    });
  });

  it("fails when translated output has a non-string value", () => {
    const result = validateTranslatedFieldKeys(
      {
        title: "Kontakt"
      },
      {
        title: 123
      }
    );

    expect(result).toEqual({
      ok: false,
      error: {
        missingKeys: [],
        extraKeys: [],
        nonStringKeys: ["title"]
      }
    });
  });
});

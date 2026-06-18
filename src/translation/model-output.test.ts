import { describe, expect, it } from "vitest";

import { ModelOutputError, parseModelOutput } from "./model-output.js";

describe("parseModelOutput", () => {
  it("parses a valid fields wrapper", () => {
    expect(parseModelOutput('{"fields":{"title":"Contact","body":"Write to me..."}}')).toEqual({
      title: "Contact",
      body: "Write to me..."
    });
  });

  it("parses fenced JSON output", () => {
    expect(parseModelOutput('```json\n{"fields":{"title":"Contact"}}\n```')).toEqual({
      title: "Contact"
    });
  });

  it("throws MODEL_OUTPUT_INVALID for invalid JSON", () => {
    expect(() => parseModelOutput("{ nope")).toThrow(ModelOutputError);
    expect(() => parseModelOutput("{ nope")).toThrow("Model output is not valid JSON");
  });

  it("throws MODEL_OUTPUT_INVALID for missing fields wrapper", () => {
    expect(() => parseModelOutput('{"title":"Contact"}')).toThrow(ModelOutputError);
  });

  it("throws MODEL_OUTPUT_INVALID for non-object fields", () => {
    expect(() => parseModelOutput('{"fields":null}')).toThrow(ModelOutputError);
    expect(() => parseModelOutput('{"fields":[]}')).toThrow(ModelOutputError);
  });
});

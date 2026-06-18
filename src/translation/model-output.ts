import { z } from "zod";

import { type ErrorCode } from "../errors.js";

const modelOutputSchema = z.object({
  fields: z.record(z.string())
});

export class ModelOutputError extends Error {
  readonly code: Extract<ErrorCode, "MODEL_OUTPUT_INVALID"> = "MODEL_OUTPUT_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "ModelOutputError";
  }
}

function unwrapJsonFence(rawOutput: string): string {
  const trimmed = rawOutput.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);

  return match?.[1] ?? trimmed;
}

export function parseModelOutput(rawOutput: string): Record<string, string> {
  const jsonText = unwrapJsonFence(rawOutput);
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new ModelOutputError("Model output is not valid JSON");
  }

  const parsedOutput = modelOutputSchema.safeParse(parsedJson);

  if (!parsedOutput.success) {
    throw new ModelOutputError("Model output does not match expected fields wrapper");
  }

  return parsedOutput.data.fields;
}

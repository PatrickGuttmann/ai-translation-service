import { type OllamaChatMessage } from "../ollama/ollama.client.js";
import { type TranslateRequest } from "../translation/translate.types.js";
import { repairSystemPrompt, translationSystemPrompt } from "./templates.js";

const maxInvalidOutputChars = 4000;

export type BuildRepairMessagesArgs = {
  expectedFieldKeys: string[];
  invalidOutput: string;
};

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars)}\n[truncated]`;
}

export function buildTranslationMessages(request: TranslateRequest): OllamaChatMessage[] {
  const payload = {
    sourceLocale: request.sourceLocale,
    targetLocale: request.targetLocale,
    contentType: request.contentType,
    tone: request.tone,
    glossary: request.glossary,
    fields: request.fields
  };

  // The model must return this stable wrapper shape so later parsing can distinguish provider text from translated fields.
  const expectedOutput = {
    fields: Object.fromEntries(Object.keys(request.fields).map((key) => [key, "translated string"]))
  };

  return [
    {
      role: "system",
      content: translationSystemPrompt
    },
    {
      role: "user",
      content: [
        "Translate this request.",
        "",
        "Input JSON:",
        stableJson(payload),
        "",
        "Return valid JSON only in this exact shape:",
        stableJson(expectedOutput)
      ].join("\n")
    }
  ];
}

export function buildRepairMessages(args: BuildRepairMessagesArgs): OllamaChatMessage[] {
  const expectedOutput = {
    fields: Object.fromEntries(args.expectedFieldKeys.map((key) => [key, "translated string"]))
  };

  return [
    {
      role: "system",
      content: repairSystemPrompt
    },
    {
      role: "user",
      content: [
        "Expected field keys:",
        stableJson(args.expectedFieldKeys),
        "",
        "Return valid JSON only in this exact shape:",
        stableJson(expectedOutput),
        "",
        "Previous invalid output:",
        truncateText(args.invalidOutput, maxInvalidOutputChars)
      ].join("\n")
    }
  ];
}

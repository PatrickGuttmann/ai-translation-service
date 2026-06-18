import { inputTooLargeErrorResponse } from "../errors.js";
import { type TranslateRequest } from "./translate.types.js";

export type InputLengthValidationResult =
  | {
      ok: true;
      inputChars: number;
    }
  | {
      ok: false;
      inputChars: number;
      error: typeof inputTooLargeErrorResponse;
    };

export type TranslatedFieldKeyValidationError = {
  missingKeys: string[];
  extraKeys: string[];
  nonStringKeys: string[];
};

export type TranslatedFieldKeyValidationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: TranslatedFieldKeyValidationError;
    };

export function calculateInputChars(request: Pick<TranslateRequest, "fields" | "glossary">): number {
  const fieldChars = Object.values(request.fields).reduce((total, value) => total + value.length, 0);

  // Glossary terms are sent to the model as input context, so they count toward the model input limit.
  const glossaryChars = Object.entries(request.glossary ?? {}).reduce(
    (total, [key, value]) => total + key.length + value.length,
    0
  );

  return fieldChars + glossaryChars;
}

export function validateInputLength(
  request: Pick<TranslateRequest, "fields" | "glossary">,
  maxInputChars: number
): InputLengthValidationResult {
  const inputChars = calculateInputChars(request);

  if (inputChars > maxInputChars) {
    return {
      ok: false,
      inputChars,
      error: inputTooLargeErrorResponse
    };
  }

  return {
    ok: true,
    inputChars
  };
}

export function validateTranslatedFieldKeys(
  inputFields: Record<string, string>,
  translatedFields: Record<string, unknown>
): TranslatedFieldKeyValidationResult {
  const inputKeys = Object.keys(inputFields);
  const translatedKeys = Object.keys(translatedFields);

  const missingKeys = inputKeys.filter((key) => !Object.hasOwn(translatedFields, key));
  const extraKeys = translatedKeys.filter((key) => !Object.hasOwn(inputFields, key));
  const nonStringKeys = translatedKeys.filter((key) => typeof translatedFields[key] !== "string");

  if (missingKeys.length > 0 || extraKeys.length > 0 || nonStringKeys.length > 0) {
    return {
      ok: false,
      error: {
        missingKeys,
        extraKeys,
        nonStringKeys
      }
    };
  }

  return {
    ok: true
  };
}

export type ErrorCode =
  | "UNAUTHORIZED"
  | "VALIDATION_ERROR"
  | "INPUT_TOO_LARGE"
  | "OLLAMA_UNAVAILABLE"
  | "OLLAMA_TIMEOUT"
  | "OLLAMA_INVALID_RESPONSE"
  | "MODEL_OUTPUT_INVALID"
  | "INTERNAL_ERROR";

export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

export function createErrorResponse(code: ErrorCode, message: string): ErrorResponse {
  return {
    error: {
      code,
      message
    }
  };
}

export const unauthorizedErrorResponse = createErrorResponse("UNAUTHORIZED", "Unauthorized");
export const validationErrorResponse = createErrorResponse("VALIDATION_ERROR", "Invalid request data");
export const inputTooLargeErrorResponse = createErrorResponse("INPUT_TOO_LARGE", "Input too large");
export const ollamaUnavailableErrorResponse = createErrorResponse("OLLAMA_UNAVAILABLE", "Ollama unavailable");
export const ollamaTimeoutErrorResponse = createErrorResponse("OLLAMA_TIMEOUT", "Ollama request timed out");
export const ollamaInvalidResponseErrorResponse = createErrorResponse(
  "OLLAMA_INVALID_RESPONSE",
  "Ollama response invalid"
);
export const modelOutputInvalidErrorResponse = createErrorResponse("MODEL_OUTPUT_INVALID", "Model output invalid");
export const internalErrorResponse = createErrorResponse("INTERNAL_ERROR", "Internal server error");

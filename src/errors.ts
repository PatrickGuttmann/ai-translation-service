export type ErrorCode = "UNAUTHORIZED" | "VALIDATION_ERROR" | "INPUT_TOO_LARGE" | "INTERNAL_ERROR";

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
export const internalErrorResponse = createErrorResponse("INTERNAL_ERROR", "Internal server error");

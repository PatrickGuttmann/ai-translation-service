export type ErrorCode = "UNAUTHORIZED" | "INTERNAL_ERROR";

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
export const internalErrorResponse = createErrorResponse("INTERNAL_ERROR", "Internal server error");

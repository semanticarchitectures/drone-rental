import { NextResponse } from "next/server";

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export class ApiErrorResponse extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiErrorResponse";
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: unknown
): NextResponse {
  const error: ApiError = {
    code,
    message,
    ...(details && { details }),
  };

  return NextResponse.json({ error }, { status: statusCode });
}

/**
 * Create validation error response
 */
export function validationError(message: string, details?: unknown): NextResponse {
  return createErrorResponse(400, ErrorCode.VALIDATION_ERROR, message, details);
}

/**
 * Create unauthorized error response
 */
export function unauthorizedError(message = "Unauthorized"): NextResponse {
  return createErrorResponse(401, ErrorCode.UNAUTHORIZED, message);
}

/**
 * Create forbidden error response
 */
export function forbiddenError(message = "Forbidden"): NextResponse {
  return createErrorResponse(403, ErrorCode.FORBIDDEN, message);
}

/**
 * Create not found error response
 */
export function notFoundError(message = "Resource not found"): NextResponse {
  return createErrorResponse(404, ErrorCode.NOT_FOUND, message);
}

/**
 * Create conflict error response
 */
export function conflictError(message: string, details?: unknown): NextResponse {
  return createErrorResponse(409, ErrorCode.CONFLICT, message, details);
}

/**
 * Create internal server error response
 */
export function internalError(message = "Internal server error", details?: unknown): NextResponse {
  return createErrorResponse(500, ErrorCode.INTERNAL_ERROR, message, details);
}

/**
 * Create bad request error response
 */
export function badRequestError(message: string, details?: unknown): NextResponse {
  return createErrorResponse(400, ErrorCode.BAD_REQUEST, message, details);
}

/**
 * Handle errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiErrorResponse) {
    return createErrorResponse(
      error.statusCode,
      error.code,
      error.message,
      error.details
    );
  }

  if (error instanceof Error) {
    console.error("API Error:", error);
    return internalError(error.message);
  }

  console.error("Unknown error:", error);
  return internalError("An unknown error occurred");
}



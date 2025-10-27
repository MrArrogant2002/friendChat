export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'HttpError';
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return typeof error === 'object' && error !== null && 'statusCode' in error;
}

export function normalizeError(error: unknown): {
  status: number;
  message: string;
  details?: unknown;
} {
  if (isHttpError(error)) {
    return {
      status: error.statusCode,
      message: error.message,
      details: error.details,
    };
  }

  const message = error instanceof Error ? error.message : 'Internal server error';

  return {
    status: 500,
    message,
  };
}

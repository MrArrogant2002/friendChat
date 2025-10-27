import { isAxiosError } from 'axios';

type MaybeStringArray = string[] | undefined;

type ErrorBody = {
  message?: unknown;
  details?: unknown;
  error?: unknown;
};

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly details?: MaybeStringArray;
  public readonly body?: unknown;

  constructor(message: string, status = 500, details?: MaybeStringArray, body?: unknown, cause?: unknown) {
    super(message, cause ? { cause } : undefined);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
    this.body = body;
  }
}

function coerceDetails(value: unknown): MaybeStringArray {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === 'object') {
    const maybeDetails = (value as ErrorBody).details;
    if (Array.isArray(maybeDetails)) {
      return maybeDetails.map((item) => String(item));
    }
    if (typeof maybeDetails === 'string') {
      return [maybeDetails];
    }
  }

  if (typeof value === 'string') {
    return [value];
  }

  return undefined;
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const data = (error.response?.data ?? {}) as ErrorBody;
    const baseMessage = typeof data.message === 'string' && data.message.length > 0
      ? data.message
      : error.message || 'Request failed';

    return new ApiClientError(baseMessage, status, coerceDetails(data), data, error);
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message || 'Unexpected error', 500, undefined, undefined, error);
  }

  return new ApiClientError('Unexpected error', 500, undefined, undefined, error);
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class AuthError extends ApiError {
  constructor(message = 'Authentication failed', body: unknown = null) {
    super(message, 401, body);
    this.name = 'AuthError';
  }
}

export class ValidationError extends ApiError {
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message = 'Validation failed',
    body: unknown = null,
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message, 400, body);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

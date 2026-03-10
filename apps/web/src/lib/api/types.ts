export type ApiEnvelope<T> = { data: T; meta?: unknown };

export type ApiErrorEnvelope = {
  error: {
    code?: string;
    message: string;
    details?: unknown;
  };
};

export type NormalizedApiError = {
  status?: number;
  code?: string;
  message: string;
  details?: unknown;
};

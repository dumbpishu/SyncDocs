export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T | null;
  meta: Record<string, unknown> | null;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors: unknown;
};

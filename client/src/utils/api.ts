import type { AxiosError } from "axios";
import type { ApiErrorResponse, ApiSuccessResponse } from "../types/api";

export const unwrapApiResponse = <T>(response: ApiSuccessResponse<T>) => response.data;

export const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.message ?? fallbackMessage;
};

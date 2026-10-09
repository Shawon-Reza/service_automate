import axios from "axios";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export async function getApiData<T>(path: string): Promise<T> {
  const response = await api.get<ApiEnvelope<T>>(path);
  return response.data.data;
}

export async function postApiData<T>(path: string, body?: unknown): Promise<T> {
  const response = await api.post<ApiEnvelope<T>>(path, body);
  return response.data.data;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

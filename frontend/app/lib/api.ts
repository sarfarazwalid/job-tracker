"use client";

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach access token to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Attempt token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            { refresh: refreshToken }
          );
          localStorage.setItem("access_token", data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem("refresh_token", data.refreshToken);
          }
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
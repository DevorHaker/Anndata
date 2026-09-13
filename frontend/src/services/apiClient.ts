import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { API_CONFIG } from "./apiConfig";
import { ApiResponse } from "../types/api";

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details: any[];
  public readonly requestId?: string;

  constructor(
    message: string,
    code = "API_ERROR",
    statusCode = 500,
    details: any[] = [],
    requestId?: string,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
  }
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Response Interceptor for Error Standardization
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response) {
      const data = error.response.data;
      const code = data?.error?.code || "HTTP_ERROR";
      const message =
        data?.error?.message || error.message || "An API error occurred";
      const details = data?.error?.details || [];
      const requestId = data?.requestId;
      return Promise.reject(
        new ApiError(message, code, error.response.status, details, requestId),
      );
    } else if (error.request) {
      return Promise.reject(
        new ApiError(
          "Unable to connect to SmartProcure backend server",
          "NETWORK_ERROR",
          0,
        ),
      );
    } else {
      return Promise.reject(new ApiError(error.message, "CLIENT_ERROR", 0));
    }
  },
);

export const apiClient = {
  get: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.get<ApiResponse<T>>(url, config);
    return res.data;
  },

  post: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.post<ApiResponse<T>>(url, data, config);
    return res.data;
  },

  put: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.put<ApiResponse<T>>(url, data, config);
    return res.data;
  },

  patch: async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return res.data;
  },

  delete: async <T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    const res = await axiosInstance.delete<ApiResponse<T>>(url, config);
    return res.data;
  },
};

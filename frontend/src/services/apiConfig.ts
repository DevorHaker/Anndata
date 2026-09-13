const getBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!envUrl) return "/api/v1";

  const cleanUrl = envUrl.replace(/\/+$/, "");
  if (cleanUrl.endsWith("/api/v1")) {
    return cleanUrl;
  }
  return `${cleanUrl}/api/v1`;
};

export const API_BASE_URL = getBaseUrl();

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT_MS: 15000,
};

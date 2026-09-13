export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  requestId?: string;
}

export interface SystemHealthData {
  status: "ok" | "degraded" | "down" | "ready" | "not_ready";
  timestamp: string;
  uptimeSeconds?: number;
  dependencies?: {
    postgres: { status: string; latencyMs?: number; message?: string };
    redis: { status: string; latencyMs?: number; message?: string };
  };
}

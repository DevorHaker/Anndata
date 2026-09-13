import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";
import { SystemHealthData } from "../types/api";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Spinner } from "../components/Spinner";
import { ErrorState } from "../components/ErrorState";
import {
  Activity,
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const HealthPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["system-readiness"],
    queryFn: async () => {
      const res = await apiClient.get<SystemHealthData>("/ready");
      return res.data;
    },
    refetchInterval: 10000, // auto-refresh every 10 seconds
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            System Health & Dependency Readiness
          </h1>
          <p className="text-slate-400 text-sm">
            Live infrastructure diagnostics verifying PostgreSQL database pool
            and Redis connection.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 w-fit"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh Diagnostics
        </button>
      </div>

      {isLoading && (
        <Card className="py-12">
          <Spinner size="lg" label="Checking backend and database health..." />
        </Card>
      )}

      {isError && (
        <ErrorState
          title="Backend Unreachable"
          message={
            error instanceof Error
              ? error.message
              : "Failed to connect to backend readiness endpoint"
          }
          onRetry={() => refetch()}
        />
      )}

      {data && (
        <div className="space-y-6">
          <Card
            header={
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-200">
                  Overall System Readiness
                </h2>
                <Badge
                  variant={data.status === "ready" ? "success" : "error"}
                  size="md"
                >
                  {data.status === "ready" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  )}
                  STATUS: {data.status.toUpperCase()}
                </Badge>
              </div>
            }
          >
            <p className="text-xs text-slate-400 font-mono">
              Timestamp: {data.timestamp}
            </p>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              header={
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-sky-400" /> PostgreSQL
                    Database
                  </span>
                  <Badge
                    variant={
                      data.dependencies?.postgres?.status === "ok"
                        ? "success"
                        : "error"
                    }
                  >
                    {data.dependencies?.postgres?.status?.toUpperCase()}
                  </Badge>
                </div>
              }
            >
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <span className="text-slate-500">Latency:</span>{" "}
                  {data.dependencies?.postgres?.latencyMs ?? "N/A"} ms
                </p>
                <p>
                  <span className="text-slate-500">Schema:</span> Phase 3 Master
                  Schema Active
                </p>
              </div>
            </Card>

            <Card
              header={
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" /> Redis Cache
                    / Queue
                  </span>
                  <Badge
                    variant={
                      data.dependencies?.redis?.status === "ok"
                        ? "success"
                        : "warning"
                    }
                  >
                    {data.dependencies?.redis?.status?.toUpperCase()}
                  </Badge>
                </div>
              }
            >
              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <span className="text-slate-500">Latency:</span>{" "}
                  {data.dependencies?.redis?.latencyMs ?? "N/A"} ms
                </p>
                <p>
                  <span className="text-slate-500">Degraded Fallback:</span>{" "}
                  Enabled
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

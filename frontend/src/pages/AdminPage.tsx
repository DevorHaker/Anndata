import React from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { ShieldCheck, BarChart3 } from "lucide-react";

export const AdminPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Admin &
              System Analytics Module
            </h2>
            <Badge variant="neutral">Phase 8</Badge>
          </div>
        }
      >
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-300">
            System administration, RBAC role overrides, district-level
            procurement analytics, dynamic AI congestion snapshots, and audit
            trail inspection.
          </p>
          <div className="glass-card p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            <p className="font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-400" /> Scheduled
              Implementation Plan:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                Phase 8: Intelligence Engine & Real-time Analytics Dashboard
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

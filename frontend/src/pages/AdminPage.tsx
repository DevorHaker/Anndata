import React from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { ShieldCheck, BarChart3 } from "lucide-react";

export const AdminPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl font-sans">
      <Card
        header={
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#0d6e48]" /> Admin &amp; System Analytics Module
            </h2>
            <Badge variant="neutral">Phase 8</Badge>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-500 font-medium">
            System administration, RBAC role overrides, district-level
            procurement analytics, dynamic AI congestion snapshots, and audit
            trail inspection.
          </p>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium">
            <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 font-serif-header">
              <BarChart3 className="w-4 h-4 text-[#0d6e48]" /> Scheduled
              Implementation Plan:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                Phase 8: Intelligence Engine &amp; Real-time Analytics Dashboard
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

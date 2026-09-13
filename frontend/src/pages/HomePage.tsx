import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import {
  CheckCircle2,
  ArrowRight,
  Server,
  Database,
  Cpu,
  Layers,
} from "lucide-react";

export const HomePage: React.FC = () => {
  const steps = [
    { title: "Register", desc: "Farmer verification" },
    { title: "Recommend", desc: "AI crop & slot guide" },
    { title: "Slot", desc: "Concurreny reservation" },
    { title: "Token", desc: "Cryptographic QR" },
    { title: "Queue", desc: "Priority waiting" },
    { title: "Procurement", desc: "Weighment & quality" },
    { title: "Payment", desc: "Automated DBT" },
    { title: "Tracking", desc: "End-to-end transparency" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="glass-panel p-8 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-4">
          <Badge variant="success" size="md">
            SIH 2026 Problem Statement SIH26032
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
            SmartProcure — Farm Gate to Payment
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Eliminating long farmer waiting times, scheduling opacity, and
            payment delays through an intelligent, concurrent procurement
            platform.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/health"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              Check System Health <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Core Product Journey */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          End-to-End Product Journey
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col justify-between"
            >
              <span className="text-xs font-mono text-emerald-400 font-bold mb-2">
                0{idx + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 4 Architectural Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          header={
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" /> Backend
              Infrastructure
            </h3>
          }
        >
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Express API
              Router (`/api/v1`)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Zod
              Environment Validation
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Standard
              Error & Logging Middleware
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Correlation
              / Request ID Middleware
            </li>
          </ul>
        </Card>

        <Card
          header={
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" /> PostgreSQL &
              Redis
            </h3>
          }
        >
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PostgreSQL
              16 Schema Integrated
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Migration &
              Seed Runner Scripts
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Redis Cache
              & Queue Client
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Degraded
              State Availability
            </li>
          </ul>
        </Card>

        <Card
          header={
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Frontend Architecture
            </h3>
          }
        >
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> React 18 +
              Vite + TypeScript
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> TanStack
              Query State Management
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Reusable
              Accessible Component Library
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Global Error
              Boundary Shell
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

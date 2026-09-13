import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ArrowRight,
  Server,
  Database,
  Cpu,
  Layers,
  Sparkles,
  TrendingDown,
  Clock,
  Users,
  ShieldCheck,
  Building2
} from "lucide-react";

export const HomePage: React.FC = () => {
  const steps = [
    { title: "Register", desc: "Farmer identity verification" },
    { title: "Recommend", desc: "AI crop & slot guide" },
    { title: "Slot", desc: "Concurrency reservation" },
    { title: "Token", desc: "Cryptographic QR code" },
    { title: "Queue", desc: "Priority wait management" },
    { title: "Procurement", desc: "Weighment & quality test" },
    { title: "Payment", desc: "Automated DBT transfer" },
    { title: "Tracking", desc: "End-to-end transparency" },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* HERO SECTION */}
      <section className="relative pt-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline & Action CTA */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* SIH Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e6f7ef] border border-[#b2e8cf] text-[#0d6e48] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIH 26032 • DEMO MODE READY</span>
            </div>

            {/* Main Serif Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif-header text-slate-900 tracking-tight leading-[1.15]">
              Smart Procurement.<br />
              <span className="text-[#0d6e48]">Less Waiting.</span><br />
              Better Service.
            </h1>

            {/* Paragraph Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              An intelligent procurement management platform that predicts congestion,
              optimizes farmer slots and helps procurement centres coordinate queues efficiently.
            </p>

            {/* CTA Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#0d6e48] hover:bg-[#095235] text-white text-sm font-semibold rounded-2xl transition shadow-lg shadow-emerald-950/10 hover:shadow-xl hover:translate-y-[-1px]"
              >
                <span>Book Procurement Slot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/centres"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#e6f7ef] hover:bg-[#d1f2e2] text-[#0d6e48] border border-[#b2e8cf] text-sm font-semibold rounded-2xl transition"
              >
                <span>Find Procurement Centre</span>
              </Link>
            </div>

            {/* Checkmarks Footer List */}
            <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>Quantity-aware scheduling</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>Dynamic queue prediction</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#0d6e48]">✓</span>
                <span>Offline-first prototype</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Centre Intelligence Mockup Card */}
          <div className="lg:col-span-5 relative">
            
            {/* Top Floating Badge: Time Saved */}
            <div className="absolute -top-6 -right-2 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3">
              <div className="text-right">
                <div className="text-emerald-700 text-sm font-extrabold font-serif-header">-26 min</div>
                <div className="text-[10px] text-slate-500 font-medium">waiting time optimized</div>
              </div>
            </div>

            {/* Bottom Floating Badge: Performance Score */}
            <div className="absolute -bottom-6 -left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-100 shadow-lg flex items-center gap-3">
              <div>
                <div className="text-[#0d6e48] text-sm font-extrabold font-serif-header">92/100</div>
                <div className="text-[10px] text-slate-500 font-medium">centre performance</div>
              </div>
            </div>

            {/* Main Widget Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 space-y-5 relative z-10">
              
              {/* Widget Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <h3 className="text-sm font-bold text-slate-900">Live Centre Intelligence</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#e6f7ef] text-[#0d6e48] text-[10px] font-bold tracking-wider">
                  OPTIMAL
                </span>
              </div>

              {/* 3 Metric Column Cards */}
              <div className="grid grid-cols-3 gap-3 text-center bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">QUEUE</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">06</div>
                  <div className="text-[9px] text-slate-500 font-medium">farmers ahead</div>
                </div>

                <div className="space-y-0.5 border-x border-slate-200 px-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ETA</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">17 <span className="text-xs font-normal">min</span></div>
                  <div className="text-[9px] text-slate-500 font-medium">estimated wait</div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOAD</div>
                  <div className="text-xl font-bold font-serif-header text-slate-900">34 <span className="text-xs font-normal">%</span></div>
                  <div className="text-[9px] text-slate-500 font-medium">centre capacity</div>
                </div>
              </div>

              {/* Live Queue Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                  <span className="px-2 py-0.5 bg-[#0d6e48] text-white text-[10px] font-bold rounded-md">A-024</span>
                  <span className="font-semibold text-slate-800">Current farmer</span>
                  <span className="text-slate-500 font-mono text-[11px]">11:42 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                  <span className="font-bold text-[#0d6e48] text-[11px]">A-025</span>
                  <span className="text-slate-600">35 q</span>
                  <span className="text-slate-400 font-mono text-[11px]">11:57 AM</span>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                  <span className="font-bold text-[#0d6e48] text-[11px]">A-026</span>
                  <span className="text-slate-600">18 q</span>
                  <span className="text-slate-400 font-mono text-[11px]">12:06 PM</span>
                </div>
              </div>

              {/* Recommendation Banner */}
              <div className="p-3 bg-[#e6f7ef] rounded-2xl border border-[#b2e8cf] text-xs space-y-0.5">
                <div className="font-bold text-[#0d6e48] text-[11px]">Smart Recommendation</div>
                <div className="text-slate-700 text-[11px]">Centre B is currently the fastest suitable option.</div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* END-TO-END PRODUCT JOURNEY */}
      <section className="space-y-6 pt-6 border-t border-slate-200/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-serif-header text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#0d6e48]" />
              End-to-End Procurement Journey
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              8-step transparent workflow from farmer identity to automated DBT payment
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {steps.map((step, idx) => (
            <div
              key={step.title}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <span className="text-xs font-mono text-[#0d6e48] font-bold mb-3">
                0{idx + 1}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ARCHITECTURAL STATUS CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Backend Infrastructure</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Express API Router (`/api/v1`)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Zod Environment Validation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Standardized Error & Logging</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Correlation Request Tracking</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">PostgreSQL Database</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>PostgreSQL 16 Schema Integrated</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Neon.tech Cloud Database Sync</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Seed & Migration Runners</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Concurrency & Lock Controls</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0d6e48] flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900">Frontend Architecture</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>React 18 + Vite + TypeScript</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>TanStack Query State Engine</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Light Mint UI Design System</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0d6e48] shrink-0" />
              <span>Global Error Boundary Shell</span>
            </li>
          </ul>
        </div>

      </section>
    </div>
  );
};

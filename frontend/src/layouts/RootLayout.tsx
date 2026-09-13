import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ConnectivityBanner } from "../components/ConnectivityBanner";

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      <ConnectivityBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <footer className="glass-panel border-t border-slate-800 py-3 px-6 text-center text-xs text-slate-500">
        SmartProcure Platform &copy; 2026 SIH Project Foundation. All Rights
        Reserved.
      </footer>
    </div>
  );
};

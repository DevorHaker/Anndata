import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ConnectivityBanner } from "../components/ConnectivityBanner";

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f4fbf7] text-slate-900 flex flex-col font-sans">
      <Header />
      <ConnectivityBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <footer className="bg-white border-t border-emerald-100/80 py-4 px-6 text-center text-xs text-slate-500 font-medium">
        Anndata Intelligent Procurement Platform &copy; 2026 SIH Project Foundation. All Rights Reserved.
      </footer>
    </div>
  );
};

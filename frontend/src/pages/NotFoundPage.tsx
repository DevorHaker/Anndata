import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Home, Compass } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto pt-12 text-center font-sans">
      <Card>
        <div className="w-16 h-16 bg-[#e6f7ef] border border-[#b2e8cf] rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#0d6e48]">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-serif-header text-slate-900 mb-2">
          404 Page Not Found
        </h1>
        <p className="text-slate-500 text-xs font-medium mb-6">
          The page or route you are looking for does not exist in the
          Anndata platform.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0d6e48] hover:bg-[#095235] text-white text-xs font-bold rounded-xl transition w-full shadow-md"
        >
          <Home className="w-4 h-4" /> Return to System Overview
        </Link>
      </Card>
    </div>
  );
};

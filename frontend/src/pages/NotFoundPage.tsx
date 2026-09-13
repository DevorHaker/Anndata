import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../components/Card";
import { Home, Compass } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto pt-12 text-center">
      <Card>
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 mb-2">
          404 Page Not Found
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          The page or route you are looking for does not exist in the
          SmartProcure system.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition w-full"
        >
          <Home className="w-4 h-4" /> Return to System Overview
        </Link>
      </Card>
    </div>
  );
};

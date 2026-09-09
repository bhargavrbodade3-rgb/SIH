import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home, Milestone, FileText, Layers } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-6 shadow-xs">
        <AlertCircle className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
        Error 404 • Page Not Found
      </span>

      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mb-3">
        Regulatory Route Not Found
      </h1>

      <p className="text-sm text-slate-600 max-w-md mx-auto mb-8 leading-relaxed">
        The compliance resource, application page, or statutory milestone you are looking for has been moved or does not exist.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/roadmap"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 shadow-xs transition"
        >
          <Milestone className="w-4 h-4 text-indigo-600" />
          <span>Regulatory Roadmap</span>
        </Link>
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 shadow-xs transition"
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Document Vault</span>
        </Link>
      </div>
    </div>
  );
}

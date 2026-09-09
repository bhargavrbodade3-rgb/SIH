import React from 'react';
import { CheckCircle2, Clock, AlertCircle, FileCheck, ShieldAlert } from 'lucide-react';

export default function Timeline({ history = [] }) {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        No state transitions recorded yet.
      </div>
    );
  }

  const getStatusIcon = (status) => {
    const s = (status || '').toUpperCase();
    if (s.includes('APPROVED') || s.includes('COMPLETED') || s.includes('PASSED')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
    if (s.includes('QUERY')) {
      return <AlertCircle className="w-4 h-4 text-amber-600" />;
    }
    if (s.includes('INSPECTION')) {
      return <FileCheck className="w-4 h-4 text-indigo-600" />;
    }
    if (s.includes('REJECTED') || s.includes('FAILED')) {
      return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    }
    return <Clock className="w-4 h-4 text-sky-600" />;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((item, index) => {
        const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
        return (
          <div key={item.id || index} className="relative group">
            {/* Timeline node */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-xs">
              {getStatusIcon(item.to_status)}
            </div>

            {/* Content card */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 hover:bg-white hover:border-slate-300 transition">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {item.to_status}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {dateStr}
                </span>
              </div>
              {item.remarks && (
                <p className="mt-1.5 text-xs text-slate-700 leading-relaxed">
                  {item.remarks}
                </p>
              )}
              {item.changed_by_name && (
                <p className="mt-2 text-[10px] text-slate-400">
                  Actor: <span className="text-slate-600 font-medium">{item.changed_by_name}</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

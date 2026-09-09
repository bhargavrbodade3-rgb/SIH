import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No Data Found',
  description = 'There are currently no records to display.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm shadow-indigo-100 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

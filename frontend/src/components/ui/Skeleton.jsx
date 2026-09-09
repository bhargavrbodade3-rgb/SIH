import React from 'react';

export function Skeleton({ className = '', variant = 'text' }) {
  let baseStyle = 'animate-pulse bg-slate-200/80 rounded';

  if (variant === 'circle') {
    baseStyle = 'animate-pulse bg-slate-200/80 rounded-full shrink-0';
  } else if (variant === 'card') {
    baseStyle = 'animate-pulse bg-slate-200/80 rounded-2xl border border-slate-200';
  }

  return <div className={`${baseStyle} ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-3 flex items-center justify-between border-t border-slate-100">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3.5 px-4">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}

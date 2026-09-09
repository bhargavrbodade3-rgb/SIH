import React from 'react';

export default function ProgressBar({
  value = 0,
  max = 100,
  showLabel = true,
  size = 'md',
  colorScheme = 'auto', // 'auto' | 'indigo' | 'emerald' | 'amber'
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  let barColor = 'bg-indigo-600';
  if (colorScheme === 'auto') {
    if (percentage >= 100) barColor = 'bg-emerald-600';
    else if (percentage >= 70) barColor = 'bg-sky-600';
    else if (percentage >= 40) barColor = 'bg-amber-500';
    else barColor = 'bg-rose-500';
  } else if (colorScheme === 'emerald') {
    barColor = 'bg-emerald-600';
  } else if (colorScheme === 'amber') {
    barColor = 'bg-amber-500';
  }

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-slate-600 mb-1.5">
          <span>Progress</span>
          <span className="tabular-nums">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${heightClass}`}>
        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          className={`${heightClass} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

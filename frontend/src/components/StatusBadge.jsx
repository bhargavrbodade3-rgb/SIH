import React from 'react';

export default function StatusBadge({ status, size = "md" }) {
  if (!status) return null;

  const s = status.toUpperCase();
  let colorStyles = "bg-slate-100 text-slate-700 border-slate-200";

  if (s === "APPROVED" || s === "VALID" || s === "PASSED" || s === "RESOLVED" || s === "100% READY" || s === "READY") {
    colorStyles = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (s === "SUBMITTED" || s === "UNDER REVIEW" || s === "ACTIVE" || s === "MATCHED") {
    colorStyles = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (s === "QUERY RAISED" || s === "ACTION REQUIRED" || s === "EXPIRING_SOON" || s === "EXPIRING SOON" || s === "RENEWAL_UPCOMING") {
    colorStyles = "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
  } else if (s === "INSPECTION SCHEDULED" || s === "INSPECTION REQUIRED") {
    colorStyles = "bg-indigo-50 text-indigo-700 border-indigo-200";
  } else if (s === "REJECTED" || s === "EXPIRED" || s === "FAILED" || s === "RENEWAL_DUE" || s === "MISSING" || s === "DOCUMENTS REQUIRED") {
    colorStyles = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (s === "NOT STARTED" || s === "UNKNOWN") {
    colorStyles = "bg-slate-100 text-slate-600 border-slate-200";
  }

  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${sizeClass} ${colorStyles} tracking-wide`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
}

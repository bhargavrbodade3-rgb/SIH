import React, { useState, useEffect } from 'react';
import { Flame, ArrowLeft, ShieldAlert, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setAnalytics(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading bottleneck telemetry...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-sky-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Admin Overview</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Bottleneck Intelligence</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
              Operational Delay Analysis
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Flame className="w-5 h-5 text-rose-600" />
            <span>Process Bottlenecks & Regulatory Latency Root Causes</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Machine-analyzed review milestones showing systemic delays across statutory departments with recommended AI mitigation workflows.
          </p>
        </div>
      </div>

      {/* Bottlenecks Detailed Cards */}
      <div className="space-y-4">
        {analytics?.bottlenecks?.map((b, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}.</span>
                <h3 className="text-base font-bold text-slate-900">{b.step_name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  +{b.average_delay_days} Days Average Delay
                </span>
                <span className="text-xs text-slate-500 font-medium">({b.affected_applications} active cases)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Identified Root Cause:</span>
                </span>
                <p className="text-slate-700 leading-relaxed">{b.root_cause_summary}</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recommended Architectural Mitigation:</span>
                </span>
                <p className="text-emerald-950 leading-relaxed font-medium">{b.recommended_mitigation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

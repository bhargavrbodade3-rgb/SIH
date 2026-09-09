import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  MessageSquareWarning
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function AdminDashboard() {
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
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return <div className="p-8 text-center text-xs text-rose-500">Analytics unavailable.</div>;

  const pendingCount = analytics.total_applications - analytics.total_approved;
  const openQueriesCount = analytics.open_queries || 1;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="State Single-Window Command Center"
        subtitle="Executive oversight of industrial compliance timelines, SLA enforcement, and inter-departmental bottleneck mitigation."
        breadcrumbs={[
          { label: 'Admin Portal' }
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/admin/analytics"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span>Deep Bottleneck Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* 26. Top 5 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Applications
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {analytics.total_applications}
          </p>
          <span className="text-[10px] text-slate-400">Total Filings</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Pending
          </p>
          <p className="text-2xl font-black text-amber-600 mt-1">
            {pendingCount}
          </p>
          <span className="text-[10px] text-amber-700 font-medium">In SLA Window</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Approved
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {analytics.total_approved}
          </p>
          <span className="text-[10px] text-emerald-700 font-medium">Certificates Issued</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Overdue
          </p>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {analytics.total_overdue}
          </p>
          <span className="text-[10px] text-rose-700 font-medium">SLA Breaches</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Open Queries
          </p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {openQueriesCount}
          </p>
          <span className="text-[10px] text-indigo-700 font-medium">Under Clarification</span>
        </div>
      </div>

      {/* 26. Readable Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Status Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Clearance Application Status Distribution
            </h3>
            <span className="text-[11px] text-slate-400">Total: {analytics.total_applications}</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.status_distribution} isAnimationActive={false}>
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Turnaround by Department */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Average Processing Turnaround by Department
            </h3>
            <span className="text-[11px] text-slate-400">Days per Clearance</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.department_stats} layout="vertical" isAnimationActive={false}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip />
                <Bar dataKey="avg_processing_days" fill="#10b981" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 26. Identified Process Bottlenecks */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>Identified Process Bottlenecks</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Root causes of SLA delays with algorithmically proposed regulatory mitigations.
            </p>
          </div>
          <Link
            to="/admin/analytics"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Detailed Analytics →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analytics.bottlenecks?.map((b, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 line-clamp-1">
                    {b.step_name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      b.impact_level === 'HIGH'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {b.impact_level} DELAY
                  </span>
                </div>
                <div className="flex items-baseline gap-1 text-xs">
                  <span className="text-lg font-black text-rose-600">+{b.average_delay_days}</span>
                  <span className="text-slate-500">Days Avg Lag</span>
                  <span className="text-slate-400 text-[11px] ml-auto">({b.affected_applications} cases)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                  {b.root_cause_summary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[11px] text-emerald-800 font-medium">
                <strong>Mitigation:</strong> {b.recommended_mitigation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/ui/PageHeader';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
  ClipboardList,
  Clock,
  MessageSquareWarning,
  CalendarCheck,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';
import api from '../api/client';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [queries, setQueries] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchOfficerData = async () => {
      try {
        const [appsRes, qRes, inspRes] = await Promise.all([
          api.get('/applications'),
          api.get('/queries').catch(() => ({ data: [] })),
          api.get('/inspections').catch(() => ({ data: [] }))
        ]);
        setApplications(appsRes.data || []);
        setQueries(qRes.data || []);
        setInspections(inspRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficerData();
  }, []);

  // 25. Officer Action Metrics
  const pendingReview = applications.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'UNDER REVIEW' || a.status === 'QUERY RAISED'
  );
  const openQueries = queries.filter((q) => q.status === 'PENDING' || q.status === 'OPEN');
  const scheduledInspections = inspections.filter((i) => i.status === 'SCHEDULED');
  const overdueApps = applications.filter((a) => a.is_overdue || (a.sla_days && a.sla_days <= 5));

  // Prioritized applications requiring immediate action
  const actionRequiredApps = applications.filter(
    (a) =>
      a.status === 'SUBMITTED' ||
      a.status === 'UNDER REVIEW' ||
      a.status === 'QUERY RAISED' ||
      a.is_overdue
  );

  const filtered = applications.filter((a) => {
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    const matchesSearch =
      a.approval_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Regulatory Scrutiny Dashboard"
        subtitle={`Logged in as ${user?.full_name || 'Dr. Vikram Deshmukh'} (${user?.department_name || 'Department Authority'})`}
        breadcrumbs={[
          { label: 'Officer Portal' }
        ]}
      />

      {/* 25. Top 4 Action Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Review
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pendingReview.length}</p>
            <span className="text-[11px] text-indigo-600 font-medium">Awaiting scrutiny</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Queries
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{openQueries.length}</p>
            <Link to="/officer/queries" className="text-[11px] text-amber-700 font-semibold hover:underline">
              View open queries →
            </Link>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Inspections Scheduled
            </p>
            <p className="text-2xl font-bold text-sky-600 mt-1">{scheduledInspections.length}</p>
            <Link to="/officer/inspections" className="text-[11px] text-sky-700 font-semibold hover:underline">
              View schedule →
            </Link>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Overdue / SLA Alerts
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{overdueApps.length}</p>
            <span className="text-[11px] text-rose-700 font-semibold">Priority scrutiny</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 25. Prioritized Applications Requiring Immediate Action */}
      {actionRequiredApps.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Applications Requiring Officer Action ({actionRequiredApps.length})
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-semibold">Priority Queue</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionRequiredApps.map((a) => (
              <div
                key={a.id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {a.approval_name}
                    </span>
                    <StatusBadge status={a.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Applicant: {a.business_name || 'Demo Food Processing Unit'} • Ref: {a.application_number}
                  </p>
                </div>
                <Link
                  to={`/officer/applications/${a.id}`}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shrink-0"
                >
                  Scrutinize →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Master Caseload Table with Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ref, approval, business..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {['ALL', 'SUBMITTED', 'UNDER REVIEW', 'QUERY RAISED', 'APPROVED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Filings' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6">
              <CardSkeleton />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <EmptyState
                icon={ClipboardList}
                title="No Applications Found"
                description="No department filings match your search criteria."
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-5">Application Ref</th>
                  <th className="py-3 px-4">Statutory Clearance</th>
                  <th className="py-3 px-4">Applicant Unit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Window</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                      {app.application_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {app.approval_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.business_name || 'Demo Food Processing Unit'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs font-medium">
                      {app.sla_days ? `${app.sla_days} Days SLA` : '30 Days SLA'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/officer/applications/${app.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                      >
                        <span>Scrutinize Filing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

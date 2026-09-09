import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ui/ProgressBar';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
  FileCheck2,
  FolderLock,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Plus,
  AlertTriangle,
  CalendarCheck,
  Award,
  Milestone,
  Check
} from 'lucide-react';
import api from '../api/client';

export default function Dashboard() {
  const { business, user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [queries, setQueries] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, docsRes, renRes, qRes, insRes, roadmapRes] = await Promise.all([
          api.get('/applications'),
          api.get('/documents'),
          api.get('/renewals'),
          api.get('/queries').catch(() => ({ data: [] })),
          api.get('/inspections').catch(() => ({ data: [] })),
          api.get('/roadmap').catch(() => ({ data: null }))
        ]);
        setApplications(appsRes.data || []);
        setDocuments(docsRes.data || []);
        setRenewals(renRes.data || []);
        setQueries(qRes.data || []);
        setInspections(insRes.data || []);
        setRoadmap(roadmapRes.data || null);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openQueries = queries.filter(q => q.status === 'PENDING');
  const expiringDocs = documents.filter(
    d => d.validity_status === 'EXPIRING_SOON' || d.validity_status === 'EXPIRING SOON'
  );
  const pendingInspections = inspections.filter(i => i.status === 'SCHEDULED');
  const actionCount = openQueries.length + expiringDocs.length + pendingInspections.length;

  // Determine current greeting time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Determine Next Best Action
  let nextAction = {
    title: 'Explore Discovery Engine',
    desc: 'Evaluate statutory clearance requirements for your food processing plant.',
    actionLabel: 'Find Approvals →',
    link: '/approvals'
  };

  if (openQueries.length > 0) {
    const q = openQueries[0];
    nextAction = {
      title: 'Respond to Regulatory Query',
      desc: `Scrutiny officer raised: "${q.subject}". Clarification required within deadline.`,
      actionLabel: 'Respond Now →',
      link: `/applications/${q.application_id}`
    };
  } else if (expiringDocs.length > 0) {
    nextAction = {
      title: 'Renew Expiring Statutory Document',
      desc: `${expiringDocs[0].name} expires soon. Upload renewed certificate to prevent compliance freeze.`,
      actionLabel: 'Review Document →',
      link: '/documents'
    };
  } else if (applications.length > 0) {
    nextAction = {
      title: 'Track Single-Window Review Progress',
      desc: 'Your statutory clearance package is under official departmental review.',
      actionLabel: 'View Application Status →',
      link: `/applications/${applications[0].id}`
    };
  }

  const profileScore = business?.profile_completion || 82;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 11. Greeting & Action Summary Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Active Industrial Applicant
            </span>
            <span className="text-xs text-slate-400">
              {business?.district || 'Pune'}, {business?.state || 'Maharashtra'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {business?.name || 'Demo Food Processing Unit'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            {actionCount > 0 ? (
              <span className="font-semibold text-amber-600">
                You have {actionCount} action{actionCount > 1 ? 's' : ''} requiring attention.
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">
                All statutory filings and documents are compliant and up to date.
              </span>
            )}
          </p>
        </div>

        {/* 14. Profile Completion Widget (Clickable) */}
        <Link
          to="/profile"
          className="group block p-4 bg-slate-50 hover:bg-indigo-50/50 rounded-xl border border-slate-200/80 hover:border-indigo-200 transition min-w-[260px]"
        >
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700 group-hover:text-indigo-900">Business Profile</span>
            <span className="text-indigo-600">{profileScore}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${profileScore}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 group-hover:text-indigo-600 font-medium">
            <span>Complete profile</span>
            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 11 & 12. Priority 1: Action Required Box */}
      {actionCount > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Action Required</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openQueries.map((q) => (
              <div
                key={q.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate">Query: {q.subject}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                    Officer requested clarification. Respond before demo deadline.
                  </p>
                </div>
                <Link
                  to={`/applications/${q.application_id}`}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition"
                >
                  Respond Now →
                </Link>
              </div>
            ))}

            {expiringDocs.map((d) => (
              <div
                key={d.id}
                className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="truncate">{d.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    1 document expiring soon. Review & update vault copy.
                  </p>
                </div>
                <Link
                  to="/documents"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shrink-0 transition"
                >
                  Review Document →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHAT SHOULD I DO NEXT? Dominant Compliance Hero Card */}
      {roadmap?.next_step && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-300 uppercase tracking-wide border border-sky-400/30 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  WHAT SHOULD I DO NEXT?
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Step {roadmap.next_step.step_order}: {roadmap.next_step.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                  {roadmap.next_step.category === 'FOUNDATIONAL' ? 'Foundational Registration' : 'Sector Clearance'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {roadmap.next_step.description}
              </p>

              <div className="flex items-center gap-5 text-xs text-slate-400 pt-1 flex-wrap">
                <span>⏱ Timeline: <strong className="text-slate-200">{roadmap.next_step.typical_timeline_days} days</strong></span>
                <span>💰 Govt. Fee: <strong className="text-slate-200">{roadmap.next_step.typical_cost}</strong></span>
                {roadmap.next_step.readiness_score !== undefined && (
                  <span className={`font-semibold ${roadmap.next_step.readiness_score === 100 ? 'text-emerald-400' : 'text-amber-300'}`}>
                    Vault Readiness: {roadmap.next_step.readiness_score}% ({roadmap.next_step.missing_documents_count || 0} missing docs)
                  </span>
                )}
                {roadmap.summary && (
                  <span className="text-indigo-300 font-medium">
                    Journey: {roadmap.summary.completed_steps}/{roadmap.summary.total_steps} complete
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <Link
                to={`/roadmap/${roadmap.next_step.id}/assistant`}
                className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <span>Launch Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {roadmap.next_step.missing_documents_count > 0 && (
                <Link
                  to="/documents"
                  className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Fix Docs ({roadmap.next_step.missing_documents_count})</span>
                </Link>
              )}
              <Link
                to="/roadmap"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition flex items-center justify-center gap-1"
              >
                <span>Roadmap →</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 49. Next Best Action Guide Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/30 text-indigo-300 uppercase tracking-wide border border-indigo-400/30">
              NEXT BEST ACTION
            </span>
            <span className="text-xs font-medium text-slate-300">{nextAction.title}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">{nextAction.desc}</p>
        </div>
        <Link
          to={nextAction.link}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition shrink-0"
        >
          {nextAction.actionLabel}
        </Link>
      </div>

      {/* 13. Quick Actions Compact Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/approvals"
            className="p-4 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200/90 hover:border-indigo-200 shadow-xs transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                + Find Approvals
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Discover applicable rules</p>
            </div>
          </Link>

          <Link
            to="/documents"
            className="p-4 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200/90 hover:border-indigo-200 shadow-xs transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FolderLock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                + Upload Document
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">OCR & expiry validation</p>
            </div>
          </Link>

          <Link
            to="/documents/planner"
            className="p-4 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200/90 hover:border-indigo-200 shadow-xs transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                + Prepare Package
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Document readiness planner</p>
            </div>
          </Link>

          <Link
            to="/applications"
            className="p-4 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200/90 hover:border-indigo-200 shadow-xs transition group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                + View Applications
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Track SLA & approvals</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Applications Status & Approvals Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Clearance Applications Progress
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking across state regulatory departments
            </p>
          </div>
          <Link
            to="/applications"
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            View All Filings →
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              <CardSkeleton />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                icon={FileText}
                title="No Applications Submitted"
                description="Begin by exploring your mandatory statutory clearances and assembling your document package."
                actionLabel="Find Applicable Approvals"
                onAction={() => navigate('/approvals')}
              />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-5">Application Ref</th>
                  <th className="py-3 px-4">Statutory Clearance</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">SLA Window</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {app.application_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {app.approval_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {app.department_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {app.sla_days ? `${app.sla_days} Days SLA` : '30 Days SLA'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <span>Details</span>
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

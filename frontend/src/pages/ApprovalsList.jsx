import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import {
  FileCheck2,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  FileText,
  Calendar,
  Sparkles
} from 'lucide-react';
import api from '../api/client';

export default function ApprovalsList() {
  const { business } = useAuth();
  const [discovered, setDiscovered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');

  useEffect(() => {
    const discover = async () => {
      setLoading(true);
      try {
        const res = await api.post('/approvals/discover', {
          sector: business?.sector || 'Food Processing',
          state: business?.state || 'Maharashtra',
          district: business?.district || 'Pune',
          investment: business?.investment || 5000000,
          employees: business?.employees || 25,
          business_stage: business?.business_stage || 'PLANNING',
          business_activity: business?.business_activity || 'Agro & Food Processing'
        });
        setDiscovered(res.data || []);
      } catch (err) {
        console.error('Failed to discover approvals:', err);
      } finally {
        setLoading(false);
      }
    };
    discover();
  }, [business]);

  const departments = ['ALL', ...new Set(discovered.map((d) => d.approval.authority).filter(Boolean))];

  const filtered = selectedDept === 'ALL'
    ? discovered
    : discovered.filter((d) => d.approval.authority === selectedDept);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Applicable Statutory Clearances"
        subtitle={`Deterministic rule evaluation for ${business?.name || 'Demo Food Processing Unit'} (${business?.sector || 'Food Processing'} in Maharashtra)`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Find Approvals' }
        ]}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-1" />
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedDept === dept
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {dept === 'ALL' ? 'All Authorities' : dept.split('(')[0].trim()}
          </button>
        ))}
      </div>

      {/* 15. Approvals Cards Grid */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No Clearances Found"
          description="Try resetting your department filter to view all statutory clearances."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const app = item.approval;
            const isFssai = app.code?.includes('FSSAI');
            const readinessScore = isFssai ? 82 : 80;
            const docCount = item.total_required_docs || 8;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-6 shadow-xs transition duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {app.code}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {app.authority || app.department_name}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        DEMO DATA
                      </span>
                      {app.mandatory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          Conditional
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                      {app.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                      {app.description}
                    </p>

                    {/* Applicability reasons */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
                      <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Statutory Trigger:</span>
                      </p>
                      <ul className="text-xs text-slate-600 pl-5 list-disc space-y-0.5">
                        {item.reasons.map((r, rIdx) => (
                          <li key={rIdx}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Metadata tags: Documents, Timeline, Fee, Renewal */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1.5 font-medium">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Documents: <strong className="text-slate-800">{docCount} required</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Timeline: <strong className="text-slate-800">{app.timeline_days} Days SLA</strong></span>
                      </div>
                      <div>
                        <span>Fee: <strong className="text-slate-800">{app.fee_estimate || '₹5,000'}</strong></span>
                      </div>
                      <div>
                        <span>Renewal: <strong className="text-slate-800">{item.renewal_requirement || 'Annual'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Readiness status & Primary Action (Section 15) */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between lg:justify-center gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 shrink-0 min-w-[210px]">
                    <div className="text-left lg:text-right space-y-1">
                      <div className="flex items-center lg:justify-end gap-1.5">
                        <span className="text-xs font-semibold text-slate-500">Readiness:</span>
                        <span className="text-sm font-extrabold text-indigo-700">{readinessScore}%</span>
                      </div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wide">
                        DOCUMENTS REQUIRED
                      </span>
                    </div>

                    <Link
                      to={`/approvals/${app.id}`}
                      className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-indigo-100 transition flex items-center justify-center gap-2"
                    >
                      <span>Prepare Application →</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

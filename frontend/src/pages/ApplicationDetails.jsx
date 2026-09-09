import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/ui/PageHeader';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  FileText,
  Clock,
  Download,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  Send,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserCheck,
  Sparkles,
  Paperclip,
  Upload
} from 'lucide-react';
import api from '../api/client';

export default function ApplicationDetails() {
  const { id } = useParams();
  const toast = useToast();

  const [app, setApp] = useState(null);
  const [queries, setQueries] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Query response form state
  const [responseText, setResponseText] = useState('');
  const [submittingResp, setSubmittingResp] = useState(false);
  const [attachedFileName, setAttachedFileName] = useState('');

  const fetchDetails = async () => {
    try {
      const [appRes, qRes, inspRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/queries?application_id=${id}`),
        api.get(`/inspections?application_id=${id}`)
      ]);
      setApp(appRes.data);
      setQueries(qRes.data || []);
      setInspections(inspRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRespondQuery = async (queryId) => {
    if (!responseText.trim()) {
      toast.error('Please enter your clarification response.');
      return;
    }
    setSubmittingResp(true);
    try {
      await api.post(`/queries/${queryId}/respond`, {
        response_text: responseText
      });
      toast.success('Clarification response submitted to scrutiny officer!');
      setResponseText('');
      setAttachedFileName('');
      await fetchDetails();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit clarification response.');
    } finally {
      setSubmittingResp(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-12 text-center text-slate-500">
        Application record not found.
      </div>
    );
  }

  const openQuery = queries.find(q => q.status === 'PENDING' || q.status === 'OPEN');
  const latestInspection = inspections[0];

  // 22. Clean Application Lifecycle Timeline Steps
  const stages = [
    { key: 'CREATED', label: 'Application Created' },
    { key: 'PREPARED', label: 'Documents Prepared' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Under Review' },
    { key: 'INSPECTION', label: 'Inspection' },
    { key: 'APPROVED', label: 'Approved' }
  ];

  // Determine current active step index
  let activeIndex = 2; // Default Submitted
  if (app.status === 'UNDER REVIEW') activeIndex = 3;
  if (app.status === 'QUERY RAISED') activeIndex = 3;
  if (app.status === 'INSPECTION SCHEDULED') activeIndex = 4;
  if (app.status === 'APPROVED') activeIndex = 5;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={app.approval_name}
        subtitle={`Application Reference: ${app.application_number} • Department: ${app.department_name}`}
        breadcrumbs={[
          { label: 'Applications', href: '/applications' },
          { label: app.application_number }
        ]}
        action={
          <a
            href={`/api/applications/${app.id}/download-package`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download Dossier Package</span>
          </a>
        }
      />

      {/* 22. Timeline Lifecycle Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
          Statutory Clearance Lifecycle
        </h3>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {stages.map((stage, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;
            return (
              <div key={stage.key} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isCompleted ? '✓' : isCurrent ? '●' : '○'}
                </div>
                <div>
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] text-indigo-500 font-medium hidden sm:inline">
                      Active Step
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* APPROVED CERTIFICATE BANNER */}
      {app.status === 'APPROVED' && (
        <div className="bg-emerald-950 text-white rounded-2xl p-6 border border-emerald-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                Official Clearance Issued
              </span>
              <span className="text-xs text-emerald-200">Digital Certificate</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Certificate No: {app.certificate_number || 'MH-IND-2026-CERT-01'}
            </h3>
            <p className="text-xs text-emerald-300/80">
              Clearance granted under {app.department_name}. Auto-registered in renewals compliance tracker.
            </p>
          </div>

          <Link
            to="/renewals"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shrink-0"
          >
            View in Renewals Tracker →
          </Link>
        </div>
      )}

      {/* 23 & 24. Two-Column Query Response Layout */}
      {openQuery && (
        <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              ACTION REQUIRED: Officer Query Clarification
            </span>
          </div>

          {/* 24. Two-Column Grid: Left Query / Right Response */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left Column: QUERY */}
            <div className="p-4 rounded-xl bg-white border border-amber-200/80 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 uppercase tracking-wider">
                    OFFICER QUERY
                  </span>
                  <span className="text-amber-700 font-semibold">
                    Deadline: {openQuery.deadline || 'Demo Deadline'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <p className="text-sm font-bold text-slate-900">{openQuery.subject}</p>
                  <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-100 italic">
                    "{openQuery.query_text || openQuery.description}"
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Raised by Scrutiny Desk • Ref: {app.application_number}
              </div>
            </div>

            {/* Right Column: RESPONSE FORM */}
            <div className="p-4 rounded-xl bg-white border border-amber-200/80 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800 uppercase tracking-wider">
                    YOUR RESPONSE
                  </span>
                  <span className="text-slate-400">Formal Clarification</span>
                </div>

                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter comprehensive clarification for the scrutiny officer..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-medium">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{attachedFileName || 'Attach Supplementary Document'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setAttachedFileName(f.name);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleRespondQuery(openQuery.id)}
                  disabled={submittingResp || !responseText.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingResp ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Response</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION STATUS */}
      {latestInspection && (
        <div className="bg-indigo-50/70 rounded-2xl border border-indigo-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-700" />
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Premises Physical Inspection Status
              </h4>
            </div>
            <StatusBadge status={latestInspection.status || 'SCHEDULED'} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-indigo-100">
              <span className="text-[10px] text-slate-400 block">Scheduled Date</span>
              <span className="font-bold text-slate-800">
                {latestInspection.scheduled_date ? new Date(latestInspection.scheduled_date).toLocaleDateString() : 'Scheduled'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-indigo-100">
              <span className="text-[10px] text-slate-400 block">Inspecting Officer</span>
              <span className="font-bold text-slate-800">{latestInspection.officer_name || 'Dr. Vikram Deshmukh'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-indigo-100">
              <span className="text-[10px] text-slate-400 block">Inspection Findings</span>
              <span className="font-bold text-slate-800">{latestInspection.remarks || 'Pending Verification'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Enclosed Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Enclosed Statutory Attachments ({app.documents?.length || 0})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {app.documents?.map((ad, idx) => (
            <div
              key={ad.id || idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-semibold text-slate-900">{ad.document?.name || ad.document?.doc_type || 'Attachment'}</p>
                <p className="text-[11px] text-slate-500 font-mono">{ad.document?.original_name || 'verified.pdf'}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Enclosed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import {
  FileCheck2,
  Download,
  AlertCircle,
  MessageSquareWarning,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Send,
  Eye,
  Building2,
  ShieldCheck,
  FileText
} from 'lucide-react';
import api from '../api/client';

export default function OfficerApplicationReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [queries, setQueries] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryForm, setQueryForm] = useState({ title: '', description: '', priority: 'HIGH', deadline: '' });

  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspForm, setInspForm] = useState({ scheduled_date: '', scheduled_time: '11:00 AM', remarks: '' });

  const [showResultModal, setShowResultModal] = useState(false);
  const [resultForm, setResultForm] = useState({ result: 'PASSED', remarks: '' });

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRemarks, setApproveRemarks] = useState('All statutory standards satisfied. Manufacturing license granted under Food Safety Act.');

  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      const [appRes, qRes, inspRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/queries?application_id=${id}`),
        api.get(`/inspections?application_id=${id}`)
      ]);
      setApp(appRes.data);
      setQueries(qRes.data);
      setInspections(inspRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleRaiseQuery = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/queries', {
        application_id: parseInt(id),
        title: queryForm.title,
        description: queryForm.description,
        priority: queryForm.priority,
        deadline: queryForm.deadline
      });
      setShowQueryModal(false);
      setQueryForm({ title: '', description: '', priority: 'HIGH', deadline: '' });
      await fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to raise query');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleInspection = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('/inspections', {
        application_id: parseInt(id),
        scheduled_date: inspForm.scheduled_date,
        scheduled_time: inspForm.scheduled_time,
        remarks: inspForm.remarks
      });
      setShowInspectionModal(false);
      await fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to schedule inspection');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordInspectionResult = async (inspId) => {
    setActionLoading(true);
    try {
      await api.put(`/inspections/${inspId}`, {
        status: 'COMPLETED',
        result: resultForm.result,
        remarks: resultForm.remarks || 'Premises inspected and verified compliant with sanitary specifications.'
      });
      setShowResultModal(false);
      await fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to record inspection outcome');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveApplication = async () => {
    setActionLoading(true);
    try {
      await api.put(`/applications/${id}/status`, {
        status: 'APPROVED',
        remarks: approveRemarks
      });
      setShowApproveModal(false);
      await fetchDetails();
    } catch (err) {
      console.error(err);
      alert('Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading dossier for scrutiny...
      </div>
    );
  }

  if (!app) return <div className="p-8 text-center text-xs text-rose-500">Application not found.</div>;

  const latestInspection = inspections[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/officer" className="hover:text-amber-600">Officer Dashboard</Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{app.application_number}</span>
      </div>

      {/* Scrutiny Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {app.application_number}
              </span>
              <StatusBadge status={app.status} />
              <span className="text-xs text-slate-500">
                SLA: <strong>{app.days_remaining !== null ? `${app.days_remaining} Days Remaining` : 'Active'}</strong>
              </span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{app.approval_name}</h2>
            <p className="text-xs text-slate-600">
              Applicant: <strong>{app.business_name}</strong> • Department: <strong>{app.department_name}</strong>
            </p>

            {/* Officer Action Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-4">
              {/* Raise Query button */}
              <button
                onClick={() => setShowQueryModal(true)}
                className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <MessageSquareWarning className="w-4 h-4 text-amber-700" />
                <span>Raise Query</span>
              </button>

              {/* Schedule Inspection button */}
              <button
                onClick={() => setShowInspectionModal(true)}
                className="px-3.5 py-2 rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-900 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <CalendarCheck className="w-4 h-4 text-indigo-700" />
                <span>Schedule Inspection</span>
              </button>

              {/* Record Inspection outcome button */}
              {latestInspection && latestInspection.status === 'SCHEDULED' && (
                <button
                  onClick={() => setShowResultModal(true)}
                  className="px-3.5 py-2 rounded-lg bg-sky-50 border border-sky-300 text-sky-900 hover:bg-sky-100 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-700" />
                  <span>Record Inspection Outcome</span>
                </button>
              )}

              {/* Approve Clearance button */}
              {app.status !== 'APPROVED' && (
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Grant Final Approval</span>
                </button>
              )}
            </div>
          </div>

          {/* Dossier Download */}
          <div className="shrink-0 flex flex-col gap-2">
            <a
              href={`/api/applications/${app.id}/download-package`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Compiled Dossier</span>
            </a>
            <p className="text-[10px] text-slate-400 text-center">Contains Cover Page & Statutory Attachments</p>
          </div>
        </div>
      </div>

      {/* Approved Certificate Notification */}
      {app.status === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Statutory License Approved & Issued
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Certificate Number: <strong>{app.certificate_number}</strong> • Registered under annual renewal monitoring.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Queries Section */}
      {queries.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-amber-600" />
            <span>Statutory Queries & Responses ({queries.length})</span>
          </h3>

          <div className="space-y-3">
            {queries.map((q) => (
              <div key={q.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{q.title}</span>
                  <StatusBadge status={q.status} size="sm" />
                </div>
                <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                  <strong>Officer Remark:</strong> {q.description}
                </p>
                {q.response_text ? (
                  <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-200 text-sky-950">
                    <p className="font-semibold text-sky-800 text-[11px] uppercase tracking-wider">Entrepreneur Response:</p>
                    <p className="mt-1">{q.response_text}</p>
                    <p className="text-[10px] text-sky-600 mt-1">Responded: {new Date(q.responded_at).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-amber-700 font-medium italic">Awaiting response from applicant enterprise before deadline ({q.deadline}).</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspections Section */}
      {inspections.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            <span>Premises Inspections Record ({inspections.length})</span>
          </h3>

          <div className="space-y-3">
            {inspections.map((insp) => (
              <div key={insp.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Date: {insp.scheduled_date} at {insp.scheduled_time}</span>
                  <StatusBadge status={insp.result || insp.status} size="sm" />
                </div>
                <p className="text-slate-600">Officer: <strong>{insp.officer_name}</strong></p>
                {insp.remarks && (
                  <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                    <strong>Findings:</strong> {insp.remarks}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attached Documents for scrutiny */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>Statutory Attachments Under Scrutiny ({app.documents?.length || 0})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {app.documents?.map((ad, idx) => (
            <div key={ad.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate">{ad.document?.doc_type}</span>
                  <StatusBadge status={ad.document?.validity_status || 'VALID'} size="sm" />
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{ad.document?.original_name}</p>
                <p className="text-[11px] text-slate-600">Ref: <strong>{ad.document?.doc_number || 'N/A'}</strong></p>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <a
                  href={`/api/documents/${ad.document?.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold text-xs"
                >
                  <span>Examine PDF</span>
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          State Transition Audit Trail
        </h3>
        <Timeline history={app.status_history} />
      </div>

      {/* MODAL 1: RAISE QUERY */}
      {showQueryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleRaiseQuery} className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-amber-600" />
                <span>Issue Statutory Clarification / Query</span>
              </h3>
              <button type="button" onClick={() => setShowQueryModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Query Title</label>
              <input
                type="text"
                required
                placeholder="e.g. HACCP Critical Control Point Clarification"
                value={queryForm.title}
                onChange={(e) => setQueryForm({ ...queryForm, title: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Regulatory Deficiency / Question</label>
              <textarea
                rows={3}
                required
                placeholder="Specify exact missing test parameter or explanation required from the applicant..."
                value={queryForm.description}
                onChange={(e) => setQueryForm({ ...queryForm, description: e.target.value })}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-500"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={queryForm.priority}
                  onChange={(e) => setQueryForm({ ...queryForm, priority: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="HIGH">HIGH (Standard SLA)</option>
                  <option value="URGENT">URGENT (Stop Review)</option>
                  <option value="MEDIUM">MEDIUM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Response Deadline</label>
                <input
                  type="date"
                  value={queryForm.deadline}
                  onChange={(e) => setQueryForm({ ...queryForm, deadline: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowQueryModal(false)} className="px-4 py-2 rounded-lg border text-xs font-semibold text-slate-600">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">
                {actionLoading ? 'Issuing Query...' : 'Issue Query to Applicant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: SCHEDULE INSPECTION */}
      {showInspectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleScheduleInspection} className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                <span>Schedule On-Site Verification Inspection</span>
              </h3>
              <button type="button" onClick={() => setShowInspectionModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Date</label>
                <input
                  type="date"
                  required
                  value={inspForm.scheduled_date}
                  onChange={(e) => setInspForm({ ...inspForm, scheduled_date: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                <input
                  type="text"
                  required
                  value={inspForm.scheduled_time}
                  onChange={(e) => setInspForm({ ...inspForm, scheduled_time: e.target.value })}
                  placeholder="e.g. 11:00 AM"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notice & Verification Focus</label>
              <textarea
                rows={2}
                value={inspForm.remarks}
                onChange={(e) => setInspForm({ ...inspForm, remarks: e.target.value })}
                placeholder="Verification of food contact surfaces, machinery spacing, and effluent neutralization pit."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg"
              ></textarea>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowInspectionModal(false)} className="px-4 py-2 rounded-lg border text-xs font-semibold text-slate-600">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                {actionLoading ? 'Scheduling...' : 'Confirm Inspection Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: RECORD INSPECTION RESULT */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Record Physical Inspection Outcome</span>
              </h3>
              <button type="button" onClick={() => setShowResultModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection Outcome</label>
              <select
                value={resultForm.result}
                onChange={(e) => setResultForm({ ...resultForm, result: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="PASSED">PASSED (Complies with all statutory standards)</option>
                <option value="CONDITIONAL">CONDITIONAL (Minor rectifications required)</option>
                <option value="FAILED">FAILED (Major non-compliance detected)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Officer Field Notes & Remarks</label>
              <textarea
                rows={3}
                value={resultForm.remarks}
                onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                placeholder="Premises machinery layout, cold storage temperature, and hygiene practices verified satisfactory."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg"
              ></textarea>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowResultModal(false)} className="px-4 py-2 rounded-lg border text-xs font-semibold text-slate-600">Cancel</button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleRecordInspectionResult(latestInspection.id)}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
              >
                {actionLoading ? 'Recording...' : 'Submit Official Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: GRANT APPROVAL */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Grant Statutory Clearance & Issue License</span>
              </h3>
              <button type="button" onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
              This action will issue an official electronic certificate with a unique statutory reference number and automatically register an annual renewal cycle in the applicant's compliance vault.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approval Endorsement Remarks</label>
              <textarea
                rows={3}
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
              ></textarea>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setShowApproveModal(false)} className="px-4 py-2 rounded-lg border text-xs font-semibold text-slate-600">Cancel</button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleApproveApplication}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {actionLoading ? 'Issuing Certificate...' : 'Approve & Issue Certificate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

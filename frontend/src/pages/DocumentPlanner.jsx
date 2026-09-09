import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileCheck2, AlertTriangle, XCircle, CheckCircle2, 
  Upload, ArrowRight, Layers, Sparkles, Clock, ShieldCheck, Download
} from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import { Skeleton, CardSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../context/ToastContext';

export default function DocumentPlanner() {
  const [searchParams] = useSearchParams();
  const approvalIdParam = searchParams.get('approval_id');
  
  const [approvals, setApprovals] = useState([]);
  const [selectedApprovalId, setSelectedApprovalId] = useState(approvalIdParam ? parseInt(approvalIdParam) : null);
  const [approval, setApproval] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocId, setUploadingDocId] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchApprovals();
  }, []);

  useEffect(() => {
    if (selectedApprovalId) {
      fetchApprovalReadiness(selectedApprovalId);
    }
  }, [selectedApprovalId]);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals');
      setApprovals(res.data || []);
      if (!selectedApprovalId && res.data && res.data.length > 0) {
        setSelectedApprovalId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load approval catalogue.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovalReadiness = async (appId) => {
    setLoading(true);
    try {
      const [appRes, readRes] = await Promise.all([
        api.get(`/approvals/${appId}`),
        api.get(`/documents/readiness/${appId}`)
      ]);
      setApproval(appRes.data);
      setReadiness(readRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Unable to calculate document readiness score.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedUpload = async (req) => {
    setUploadingDocId(req.doc_type);
    try {
      // Simulate quick auto-match upload for SIH demo flow
      const formData = new FormData();
      // create a dummy blob
      const dummyFile = new File(
        [`Statutory Document: ${req.document_name}\nClearance: ${approval?.name}\nTimestamp: ${new Date().toISOString()}`],
        `${req.document_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        { type: 'application/pdf' }
      );
      formData.append('file', dummyFile);
      formData.append('doc_type', req.doc_type);
      formData.append('name', req.document_name);

      await api.post('/documents/upload', formData);
      toast.success(`Uploaded and matched "${req.document_name}"!`);
      // Refresh readiness
      await fetchApprovalReadiness(selectedApprovalId);
    } catch (err) {
      console.error(err);
      toast.error('Failed to attach document. Please try again.');
    } finally {
      setUploadingDocId(null);
    }
  };

  const availableDocs = readiness?.requirements?.filter(r => r.matched_document && r.status === 'VALID') || [];
  const expiringDocs = readiness?.requirements?.filter(r => r.matched_document && r.status === 'EXPIRING_SOON') || [];
  const missingDocs = readiness?.requirements?.filter(r => !r.matched_document) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Document Planner & Compliance Readiness"
        subtitle="Evaluate statutory document completeness, detect missing clearances, and prepare single-window submission packages."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Documents', href: '/documents' },
          { label: 'Document Planner' },
        ]}
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedApprovalId || ''}
              onChange={(e) => setSelectedApprovalId(parseInt(e.target.value))}
              className="text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {approvals.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.code})
                </option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <>
          {/* Readiness Score Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {approval?.department_name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Ref: {approval?.code}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {approval?.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                  {approval?.description || 'Mandatory statutory clearance for food processing and manufacturing in Maharashtra.'}
                </p>

                <div className="pt-2 max-w-lg">
                  <ProgressBar
                    value={readiness?.score || 0}
                    size="lg"
                    colorScheme="auto"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {readiness?.matched_count || 0} of {readiness?.total_required || 0} statutory documents verified and ready.
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center shrink-0">
                <button
                  onClick={() => navigate(`/approvals/${selectedApprovalId}`)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm shadow-indigo-100 transition flex items-center justify-center gap-2"
                >
                  <span>Prepare Application Package</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to="/documents"
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs sm:text-sm transition text-center"
                >
                  Open Document Vault
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800">Available & Valid</p>
                <p className="text-lg font-bold text-emerald-950">
                  {availableDocs.length} Documents
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-800">Expiring Soon</p>
                <p className="text-lg font-bold text-amber-950">
                  {expiringDocs.length} Documents
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-rose-800">Missing / Required</p>
                <p className="text-lg font-bold text-rose-950">
                  {missingDocs.length} Documents
                </p>
              </div>
            </div>
          </div>

          {/* Requirement Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Statutory Document Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Checklist of certificates, NOCs and test reports required by {approval?.department_name}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-5">Requirement Name</th>
                    <th className="py-3 px-4">Mandatory</th>
                    <th className="py-3 px-4">Matched Vault Document</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {readiness?.requirements?.map((req, idx) => {
                    const isMatched = !!req.matched_document;
                    const isExpiring = req.status === 'EXPIRING_SOON';
                    const isUploadingThis = uploadingDocId === req.doc_type;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-5 font-medium text-slate-900">
                          <div>
                            <span className="font-semibold">{req.document_name}</span>
                            <span className="block text-[11px] text-slate-400 mt-0.5">
                              Code: {req.doc_type}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.is_mandatory ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                              Mandatory
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Optional
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isMatched ? (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">
                                {req.matched_document.name}
                              </span>
                              {req.matched_document.file_size_kb && (
                                <span className="text-[10px] text-slate-400">
                                  ({req.matched_document.file_size_kb} KB)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not in Vault</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isMatched ? (
                            isExpiring ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Expiring Soon
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Valid & Verified
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {isMatched ? (
                            <Link
                              to="/documents"
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-1"
                            >
                              <span>View in Vault</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleSimulatedUpload(req)}
                              disabled={isUploadingThis}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition border border-indigo-200/60"
                            >
                              {isUploadingThis ? (
                                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>Upload & Match</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

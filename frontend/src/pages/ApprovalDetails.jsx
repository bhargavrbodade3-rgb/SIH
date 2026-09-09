import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import ProgressBar from '../components/ui/ProgressBar';
import { CardSkeleton } from '../components/ui/Skeleton';
import {
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Upload,
  Download,
  FileText,
  Layers,
  Sparkles,
  Sliders,
  Send,
  Eye,
  Check,
  MoveUp,
  MoveDown,
  ArrowLeft,
  Calendar,
  IndianRupee,
  Building2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import api from '../api/client';

export default function ApprovalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { business } = useAuth();
  const toast = useToast();

  const [approval, setApproval] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Animated readiness score state
  const [displayScore, setDisplayScore] = useState(0);

  // 5-step PDF Package Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Select, 2: Arrange, 3: Compress, 4: Preview, 5: Generate
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [orderedDocs, setOrderedDocs] = useState([]);
  const [compressionLevel, setCompressionLevel] = useState('High Quality');
  const [generatingPackage, setGeneratingPackage] = useState(false);
  const [packageResult, setPackageResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMissing, setUploadingMissing] = useState(false);

  const fetchReadiness = async (animate = false) => {
    try {
      const [appRes, readRes] = await Promise.all([
        api.get(`/approvals/${id}`),
        api.get(`/documents/readiness/${id}?business_id=${business?.id}`)
      ]);
      setApproval(appRes.data);
      setReadiness(readRes.data);

      const target = readRes.data?.readiness_percentage || 0;
      if (animate) {
        animateScore(displayScore, target);
      } else {
        setDisplayScore(target);
      }

      // Pre-populate documents for wizard
      const matched = (readRes.data?.requirements_status || [])
        .filter(r => r.matched_document)
        .map(r => r.matched_document);
      setOrderedDocs(matched);
      setSelectedDocIds(matched.map(d => d.id));
    } catch (err) {
      console.error('Error fetching approval details:', err);
      toast.error('Failed to load approval details.');
    } finally {
      setLoading(false);
    }
  };

  const animateScore = (start, end) => {
    const duration = 400;
    const steps = 15;
    const increment = (end - start) / steps;
    let stepCount = 0;
    const timer = setInterval(() => {
      stepCount++;
      if (stepCount >= steps) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(prev => Math.round(prev + increment));
      }
    }, duration / steps);
  };

  useEffect(() => {
    fetchReadiness();
  }, [id, business]);

  const handleSeedMissing = async () => {
    setUploadingMissing(true);
    try {
      const formData = new FormData();
      formData.append('business_id', business?.id);
      await api.post('/documents/seed-missing-document', formData);
      toast.success('Attached verified Technical Project Report to Document Vault!');
      await fetchReadiness(true);
    } catch (err) {
      console.error('Failed to seed missing document:', err);
      toast.error('Failed to attach document.');
    } finally {
      setUploadingMissing(false);
    }
  };

  const moveDoc = (index, direction) => {
    const newDocs = [...orderedDocs];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newDocs.length) return;
    const temp = newDocs[index];
    newDocs[index] = newDocs[targetIdx];
    newDocs[targetIdx] = temp;
    setOrderedDocs(newDocs);
  };

  const handleGeneratePackage = async () => {
    setGeneratingPackage(true);
    try {
      const res = await api.post('/documents/merge-package', {
        business_id: business?.id,
        approval_id: parseInt(id),
        document_ids: selectedDocIds,
        compression_level: compressionLevel
      });
      setPackageResult(res.data);
      setCurrentStep(5);
      toast.success('Single-Window PDF Package compiled successfully!');
    } catch (err) {
      console.error('Failed to compile package:', err);
      toast.error('Error generating application dossier.');
    } finally {
      setGeneratingPackage(false);
    }
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/applications', {
        business_id: business?.id,
        approval_id: parseInt(id),
        document_ids: selectedDocIds,
        compression_level: compressionLevel
      });
      toast.success('Application submitted to single-window gateway!');
      setWizardOpen(false);
      navigate(`/applications/${res.data.id}`);
    } catch (err) {
      console.error('Failed to submit application:', err);
      toast.error('Error submitting statutory application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!approval || !readiness) {
    return (
      <div className="p-12 text-center text-slate-500">
        Approval clearance record could not be found.
      </div>
    );
  }

  const isReady = readiness.readiness_percentage >= 100;
  const missingItems = readiness.requirements_status?.filter(r => r.status === 'MISSING') || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title={approval.name}
        subtitle={`${approval.authority || approval.department_name} • Ref: ${approval.code}`}
        breadcrumbs={[
          { label: 'Approvals', href: '/approvals' },
          { label: approval.name }
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('requirements')}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-semibold transition"
            >
              View Requirements
            </button>
            <button
              onClick={() => {
                setCurrentStep(1);
                setWizardOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-100 transition flex items-center gap-2"
            >
              <span>Prepare Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* Top Section / Summary Banner (Section 16) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {approval.code}
              </span>
              <span className="text-xs font-bold text-slate-700">{approval.authority}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase">
                {approval.mandatory ? 'Mandatory Statutory Clearance' : 'Conditional'}
              </span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                DEMO DATA
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {approval.description}
            </p>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Statutory SLA
                </span>
                <span className="text-sm font-bold text-slate-900">{approval.timeline_days} Days</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Govt Scrutiny Fee
                </span>
                <span className="text-sm font-bold text-slate-900">{approval.fee_estimate || '₹7,500'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Renewal Horizon
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Every {approval.renewal_frequency_months || 12} Months
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Required Docs
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {readiness.total_required} Attachments
                </span>
              </div>
            </div>
          </div>

          {/* 20. Animated Readiness Score Gauge */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 min-w-[260px] text-center border border-slate-800 shadow-md shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Application Readiness
            </span>
            <div className="my-2">
              <span
                className={`text-4xl font-extrabold tabular-nums transition-colors duration-300 ${
                  displayScore >= 100 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {displayScore}%
              </span>
              <span className="text-xs text-slate-400 ml-1 font-bold">Ready</span>
            </div>

            <p className="text-[11px] font-bold text-slate-300">
              {displayScore >= 100 ? '✓ Application Ready' : 'DOCUMENTS REQUIRED'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {readiness.total_matched} of {readiness.total_required} documents valid & available
            </p>

            <div className="mt-4 pt-3 border-t border-slate-800">
              {displayScore >= 100 ? (
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setWizardOpen(true);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  Generate Application Package →
                </button>
              ) : (
                <button
                  onClick={handleSeedMissing}
                  disabled={uploadingMissing}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  {uploadingMissing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Attach Missing Document</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 16. Tabs: Overview, Requirements, Documents, Application, Timeline */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-xs sm:text-sm font-semibold">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'requirements', label: `Requirements (${readiness.requirements_status?.length || 0})` },
            { id: 'documents', label: 'Documents & Vault Match' },
            { id: 'application', label: 'Application Package' },
            { id: 'timeline', label: 'SLA Timeline' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 relative transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 font-bold border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Legal Authority & Basis</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Issued under the authority of <strong>{approval.authority}</strong> under applicable state laws and rules. Required prior to commercial production or occupancy.
            </p>
            <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-800">{approval.department_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Jurisdiction:</span>
                <span className="font-semibold text-slate-800">State of Maharashtra</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Validity Period:</span>
                <span className="font-semibold text-slate-800">
                  {approval.renewal_frequency_months ? `${approval.renewal_frequency_months / 12} Year(s)` : 'Permanent until expansion'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Industrial Readiness Checklist</h3>
            <div className="space-y-2.5">
              {readiness.requirements_status?.map((req, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                  <span className="font-medium text-slate-700 truncate">{req.document_name}</span>
                  {req.status === 'VALID' ? (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Valid
                    </span>
                  ) : (
                    <span className="text-[11px] text-rose-700 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Missing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Requirements */}
      {activeTab === 'requirements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Statutory Requirement Specifications
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Rules defined in single-window engine
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-5">Requirement Name</th>
                  <th className="py-3 px-4">Document Type</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Mandatory</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {readiness.requirements_status?.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">{req.document_name}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{req.doc_type}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">Standard Format (PDF/A)</td>
                    <td className="py-3.5 px-4">
                      {req.is_mandatory ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {req.status === 'VALID' ? (
                        <span className="text-emerald-700 font-semibold text-xs">Available</span>
                      ) : (
                        <span className="text-rose-700 font-semibold text-xs">Missing</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Documents & Vault Match */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Matched Vault Documents
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory documents auto-detected from your secure Document Vault
              </p>
            </div>
            <Link
              to="/documents"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Vault →
            </Link>
          </div>

          <div className="p-5 space-y-3">
            {readiness.requirements_status?.map((req, idx) => {
              const doc = req.matched_document;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 hover:bg-white transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {req.document_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {doc ? (
                          <span>File: {doc.name} • {doc.file_size_kb || 250} KB • Vault ID: #{doc.id}</span>
                        ) : (
                          <span className="text-rose-600">No document matching type '{req.doc_type}' found</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {doc ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleSeedMissing}
                        disabled={uploadingMissing}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Application Package */}
      {activeTab === 'application' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Application Package Compiler</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Merges all required statutory certificates into a single indexed PDF with bookmarks and dynamic compression.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">5-Step Package Wizard Ready</p>
              <p className="text-xs text-slate-500">
                Custom ordering, compression presets, table of contents, and digital signature packaging.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentStep(1);
                setWizardOpen(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition shrink-0"
            >
              Launch Package Wizard →
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Statutory SLA Timeline</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Guaranteed regulatory review windows under the Maharashtra Right to Public Services Act.
            </p>
          </div>

          <div className="relative pl-6 space-y-6 border-l-2 border-indigo-100">
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
              <p className="text-xs font-bold text-slate-900">Day 0: Application Submission & Acknowledgment</p>
              <p className="text-xs text-slate-500 mt-0.5">Automated document verification and receipt generation.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-slate-100" />
              <p className="text-xs font-bold text-slate-900">Day 1–7: First Level Scrutiny & Query Window</p>
              <p className="text-xs text-slate-500 mt-0.5">Scrutiny officer inspects technical drawings and test reports.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-slate-100" />
              <p className="text-xs font-bold text-slate-900">Day 8–15: Physical Site Inspection (if triggered)</p>
              <p className="text-xs text-slate-500 mt-0.5">Field officer visits premises for machinery and safety inspection.</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-slate-100" />
              <p className="text-xs font-bold text-slate-900">Day 30: Final Approval & Certificate Grant</p>
              <p className="text-xs text-slate-500 mt-0.5">Digital certificate issued with QR verification code.</p>
            </div>
          </div>
        </div>
      )}

      {/* 21. PDF Package Flow 5-Step Wizard Modal */}
      <Modal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title="Application Package Wizard"
        subtitle={`Step ${currentStep} of 5: ${
          currentStep === 1
            ? 'Select Documents'
            : currentStep === 2
            ? 'Arrange Documents'
            : currentStep === 3
            ? 'Compression Settings'
            : currentStep === 4
            ? 'Review & Preview'
            : 'Package Generated'
        }`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Step indicator bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-semibold">
            {[
              { num: 1, label: 'Select' },
              { num: 2, label: 'Arrange' },
              { num: 3, label: 'Compress' },
              { num: 4, label: 'Preview' },
              { num: 5, label: 'Generate' }
            ].map(s => (
              <div
                key={s.num}
                className={`flex items-center gap-1.5 ${
                  currentStep === s.num
                    ? 'text-indigo-600 font-bold'
                    : currentStep > s.num
                    ? 'text-emerald-600 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    currentStep === s.num
                      ? 'bg-indigo-600 text-white'
                      : currentStep > s.num
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {currentStep > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>

          {/* STEP 1: Select Documents */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Choose the verified vault documents to compile into your formal regulatory submission package:
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {orderedDocs.map(doc => {
                  const isChecked = selectedDocIds.includes(doc.id);
                  return (
                    <label
                      key={doc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isChecked ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocIds([...selectedDocIds, doc.id]);
                            } else {
                              setSelectedDocIds(selectedDocIds.filter(id => id !== doc.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{doc.name}</p>
                          <p className="text-[11px] text-slate-500">{doc.doc_type} • {doc.file_size_kb || 250} KB</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Valid & Verified
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Arrange Documents */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Order documents as required by department scrutiny guidelines (use arrows to reorder):
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {orderedDocs
                  .filter(d => selectedDocIds.includes(d.id))
                  .map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">{doc.doc_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveDoc(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveDoc(idx, 1)}
                          disabled={idx === orderedDocs.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* STEP 3: Compression */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Select target PDF compression profile to satisfy government upload portal limits:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { title: 'High Quality', desc: 'No resolution loss (DPI 300). Ideal for drawings.', ratio: '~3.2 MB' },
                  { title: 'Balanced', desc: 'Optimized vector downsampling (DPI 150). Recommended.', ratio: '~1.8 MB' },
                  { title: 'Maximum Compression', desc: 'Aggressive compression (DPI 96) for slow networks.', ratio: '~950 KB' }
                ].map(opt => (
                  <div
                    key={opt.title}
                    onClick={() => setCompressionLevel(opt.title)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      compressionLevel === opt.title
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{opt.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{opt.desc}</p>
                    <span className="inline-block mt-3 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Est. {opt.ratio}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Ready to assemble single-window dossier with unified table of contents and regulatory metadata:
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant Enterprise:</span>
                  <span className="font-bold text-slate-800">{business?.name || 'Demo Food Processing Unit'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statutory Clearance:</span>
                  <span className="font-bold text-slate-800">{approval.name} ({approval.code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Included Documents:</span>
                  <span className="font-bold text-slate-800">{selectedDocIds.length} Attachments</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Compression Preset:</span>
                  <span className="font-bold text-slate-800">{compressionLevel}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Generate & Submit */}
          {currentStep === 5 && (
            <div className="space-y-5 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Application Package Compiled</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Consolidated PDF package has been generated with automated bookmarks, page indexing, and QR authenticity seal.
                </p>
              </div>

              {packageResult && (
                <div className="max-w-xs mx-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 truncate">{packageResult.package_filename || 'Approval_Package.pdf'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Size: {packageResult.size_kb || 420} KB</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleSubmitApplication}
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Submit Filing to Department</span>
                </button>
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 && currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : currentStep === 4 ? (
              <button
                onClick={handleGeneratePackage}
                disabled={generatingPackage}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-2"
              >
                {generatingPackage && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Generate Dossier Package</span>
              </button>
            ) : (
              <button
                onClick={() => setWizardOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Close Wizard
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

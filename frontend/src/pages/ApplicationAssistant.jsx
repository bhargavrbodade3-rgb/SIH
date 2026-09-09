import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import api from '../api/client';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Shield,
  HelpCircle,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Info,
  Eye,
  BookOpen,
  Layers,
  CheckSquare,
  Square,
  Lock,
  ChevronRight,
  Sparkles,
  Send,
  FileCheck2
} from 'lucide-react';

export default function ApplicationAssistant() {
  const { stepId } = useParams();
  const navigate = useNavigate();
  const { business } = useAuth();
  const toast = useToast();

  const [assistantData, setAssistantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedKey, setCopiedKey] = useState(null);
  const [checklistState, setChecklistState] = useState({});
  const [completedPortalSteps, setCompletedPortalSteps] = useState({});

  // Tracker form state
  const [statusForm, setStatusForm] = useState({
    status: 'NOT_STARTED',
    reference_number: '',
    notes: '',
  });
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Quick document upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedReqName, setSelectedReqName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchAssistant = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/roadmap/${stepId}/assistant`);
      setAssistantData(res.data);
      
      // Initialize status form
      if (res.data?.current_status) {
        setStatusForm({
          status: res.data.current_status.status || 'NOT_STARTED',
          reference_number: res.data.current_status.reference_number || '',
          notes: res.data.current_status.notes || '',
        });
      }

      // Initialize checklist state from localStorage if available
      const savedChecklist = localStorage.getItem(`assistant_checklist_${stepId}`);
      if (savedChecklist) {
        try {
          setChecklistState(JSON.parse(savedChecklist));
        } catch (e) {
          // ignore
        }
      }

      // Initialize portal steps state from localStorage
      const savedSteps = localStorage.getItem(`assistant_portal_steps_${stepId}`);
      if (savedSteps) {
        try {
          setCompletedPortalSteps(JSON.parse(savedSteps));
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      console.error('Error fetching step assistant:', err);
      toast.error('Failed to load application assistant details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stepId) {
      fetchAssistant();
    }
  }, [stepId]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleChecklistItem = (idx) => {
    const updated = { ...checklistState, [idx]: !checklistState[idx] };
    setChecklistState(updated);
    localStorage.setItem(`assistant_checklist_${stepId}`, JSON.stringify(updated));
  };

  const togglePortalStep = (stepNum) => {
    const updated = { ...completedPortalSteps, [stepNum]: !completedPortalSteps[stepNum] };
    setCompletedPortalSteps(updated);
    localStorage.setItem(`assistant_portal_steps_${stepId}`, JSON.stringify(updated));
  };

  const handleSaveStatus = async (e) => {
    e?.preventDefault();
    try {
      setSubmittingStatus(true);
      const res = await api.put(`/roadmap/${stepId}/status`, {
        status: statusForm.status,
        reference_number: statusForm.reference_number.trim() || null,
        notes: statusForm.notes.trim() || null,
      });
      toast.success(res.data.message || 'Application tracker updated!');
      await fetchAssistant();
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleQuickUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload.');
      return;
    }

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('doc_type', selectedReqName || 'Regulatory Document');
      formData.append('category', 'Statutory Clearance');

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`Successfully uploaded "${uploadFile.name}" to Document Vault!`);
      setUploadModalOpen(false);
      setUploadFile(null);
      await fetchAssistant();
    } catch (err) {
      console.error('Failed to upload document:', err);
      toast.error(err.response?.data?.detail || 'Document upload failed.');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading && !assistantData) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Application Preparation Assistant"
          subtitle="Loading official portal guide and document readiness analysis..."
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Roadmap', href: '/roadmap' }, { label: 'Assistant' }]}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const { step, business: biz, official_source, portal_guide_steps, required_information, field_guidance, preparation_checklist, document_readiness, current_status } = assistantData;

  const readinessScore = document_readiness?.readiness_score || 0;
  const docItems = document_readiness?.items || [];
  const missingDocsCount = document_readiness?.missing_count || 0;
  const totalDocsCount = document_readiness?.total_required || 0;

  const tabs = [
    { id: 'overview', label: '1. Overview & Authority', icon: BookOpen },
    { id: 'checklist', label: '2. Before You Start', icon: CheckSquare },
    { id: 'documents', label: `3. Required Documents (${totalDocsCount - missingDocsCount}/${totalDocsCount})`, icon: FileText },
    { id: 'information', label: '4. Required Info & Autofill', icon: Layers },
    { id: 'portal_guide', label: '5. Portal Step-by-Step Guide', icon: ExternalLink },
    { id: 'field_help', label: '6. Field-by-Field Help', icon: HelpCircle },
    { id: 'tracker', label: '7. Application Tracker', icon: Send },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* 1. Header with Breadcrumbs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/roadmap"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Roadmap
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {step.category.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span>{step.name}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {step.code}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{step.issuing_authority}</span>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={step.official_portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition"
          >
            <span>Open Official Portal</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={fetchAssistant}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-xs transition"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Key Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-xs">
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium">Official SLA / Timeline</span>
          <p className="font-bold text-slate-800 text-sm">⏱ {step.typical_timeline_days} days</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium">Estimated Statutory Fee</span>
          <p className="font-bold text-slate-800 text-sm truncate" title={step.typical_cost}>
            💰 {step.typical_cost}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium">Premises Tenure</span>
          <p className="font-bold text-slate-800 text-sm uppercase">
            🏢 {biz?.premises_type || 'Rented'}
          </p>
        </div>
        <div className="space-y-0.5">
          <span className="text-slate-400 font-medium">Document Vault Readiness</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`font-bold text-sm ${readinessScore === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {readinessScore}% Ready
            </span>
            <span className="text-[11px] text-slate-400">
              ({totalDocsCount - missingDocsCount}/{totalDocsCount} Docs)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Modern Interactive Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab 1: Overview & Authority */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Statutory Purpose & Regulatory Scope
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {step.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Governing Statutory Act
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {official_source?.act || 'State / Central Industrial Regulation Act'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Validity & Renewal Mandate
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {official_source?.renewal_info || 'Annual Renewal / Permanent'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Official Portal Verification
                </span>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Last Reviewed: {official_source?.last_reviewed || '15/08/2026'}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    <Check className="w-3 h-3 text-emerald-600" /> Verified
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Official Single-Window / Portal Link
                </span>
                <p className="text-sm">
                  <a
                    href={step.official_portal_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 truncate max-w-full"
                  >
                    <span className="truncate">{step.official_portal_url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </p>
              </div>
            </div>

            {/* Official Source Disclaimer */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Government Single-Window Preparation Disclaimer:</span> This assistant provides automated document readiness audits, autofill data mapping, and official portal walkthroughs. All official filings and government statutory fees must be completed directly on the official department portal. Antigravity does not submit false registrations.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Before You Start (Checklist) */}
      {activeTab === 'checklist' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              Essential Pre-Application Checklist
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Check off each prerequisite to ensure you do not encounter unexpected halts during portal submission.
            </p>
          </div>

          <div className="space-y-3">
            {preparation_checklist.map((item, idx) => {
              const isChecked = Boolean(checklistState[idx]);
              return (
                <div
                  key={idx}
                  onClick={() => toggleChecklistItem(idx)}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 text-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition shrink-0 ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <div className="text-xs sm:text-sm leading-relaxed">
                    <span className={isChecked ? 'line-through text-slate-500' : 'font-medium'}>
                      {item}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              {Object.values(checklistState).filter(Boolean).length} of {preparation_checklist.length} items checked
            </span>
            <button
              onClick={() => setActiveTab('documents')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              <span>Next: Check Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Required Documents (Vault Matching) */}
      {activeTab === 'documents' && (
        <div className="space-y-5">
          {/* Readiness Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Document Vault Readiness Audit
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Requirements dynamically adjusted for <strong>{biz?.premises_type || 'Rented'}</strong> premises tenure.
                </p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-extrabold ${readinessScore === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {readinessScore}% Ready
                </span>
                <p className="text-xs text-slate-400">
                  {totalDocsCount - missingDocsCount} of {totalDocsCount} documents available
                </p>
              </div>
            </div>

            <ProgressBar
              progress={readinessScore}
              height="h-2.5"
              color={readinessScore === 100 ? 'bg-emerald-500' : 'bg-amber-500'}
              showLabel={false}
            />

            {missingDocsCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    You have <strong>{missingDocsCount} missing document{missingDocsCount > 1 ? 's' : ''}</strong> required for this application.
                  </span>
                </div>
                <Link
                  to="/documents"
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs shrink-0 transition"
                >
                  Open Vault →
                </Link>
              </div>
            )}
          </div>

          {/* Document Checklist Items */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statutory Uploads Checklist
            </h3>

            <div className="divide-y divide-slate-100">
              {docItems.map((doc, idx) => {
                const isMatched = Boolean(doc.matched_document);
                const isPremisesDoc = doc.requirement_name?.toLowerCase().includes('rent') ||
                  doc.requirement_name?.toLowerCase().includes('lease') ||
                  doc.requirement_name?.toLowerCase().includes('ownership') ||
                  doc.requirement_name?.toLowerCase().includes('tax receipt');

                return (
                  <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">
                          {doc.requirement_name}
                        </span>
                        {isPremisesDoc && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                            Premises ({biz?.premises_type || 'Rented'})
                          </span>
                        )}
                        {doc.is_mandatory && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                            MANDATORY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Required Type: <span className="font-semibold text-slate-700">{doc.required_type}</span>
                      </p>
                      {isMatched ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Matched Vault File: {doc.matched_document.original_name}</span>
                          <span className="text-slate-400 font-normal">
                            ({doc.matched_document.validity_status || 'VALID'})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                          <span>Missing in Document Vault</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isMatched ? (
                        <Link
                          to="/documents"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>View in Vault</span>
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedReqName(doc.required_type || doc.requirement_name);
                            setUploadModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Required Information & Autofill */}
      {activeTab === 'information' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Application Form Information & Autofill
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Review your entity details below. Click <strong>Copy</strong> to quickly paste each field directly into the government portal without typos.
              </p>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 shrink-0 transition"
            >
              <span>Edit Profile Data</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {required_information.map((field) => {
              const hasValue = Boolean(field.current_value);
              const isCopied = copiedKey === field.key;

              return (
                <div
                  key={field.key}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 relative hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-600">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="text-[10px] font-semibold text-red-500 uppercase">
                        Required
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    <span className={`text-xs sm:text-sm truncate font-mono ${hasValue ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'}`}>
                      {hasValue ? field.current_value : 'Not set in profile'}
                    </span>
                    {hasValue && (
                      <button
                        type="button"
                        onClick={() => handleCopy(field.current_value, field.key)}
                        className={`p-1.5 rounded-md transition shrink-0 ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title="Copy value"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Tab 5: Government Portal Step-by-Step Guide */}
      {activeTab === 'portal_guide' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-indigo-600" />
                Official Government Portal Navigation Walkthrough
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Follow these exact steps on the {step.issuing_authority} portal to register and submit your application.
              </p>
            </div>
            <a
              href={step.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition shrink-0"
            >
              <span>Launch Portal ↗</span>
            </a>
          </div>

          <div className="space-y-4">
            {portal_guide_steps.map((pstep) => {
              const isDone = Boolean(completedPortalSteps[pstep.step_num]);

              return (
                <div
                  key={pstep.step_num}
                  className={`p-5 rounded-2xl border transition ${
                    isDone
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 text-white'
                      }`}>
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : pstep.step_num}
                      </div>
                      <div className="space-y-1">
                        <h3 className={`text-sm font-bold ${isDone ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {pstep.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {pstep.instruction}
                        </p>
                        {pstep.portal_url && (
                          <div className="pt-1">
                            <a
                              href={pstep.portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                            >
                              <span>Direct Link: {pstep.portal_url}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => togglePortalStep(pstep.step_num)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      <span>{isDone ? 'Completed' : 'Mark Step Done'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 9. Tab 6: Field-by-Field Help */}
      {activeTab === 'field_help' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              Field-by-Field Clarifications & Pitfall Traps
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Avoid departmental queries and application rejection by reviewing these critical field specifications.
            </p>
          </div>

          <div className="space-y-4">
            {field_guidance.map((fg, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {fg.field_name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 self-start sm:self-auto">
                    Section: {fg.form_section}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-500 block">Where to Find / Explanation</span>
                    <p className="text-slate-700">{fg.where_to_find}</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-500 block">Recommended / Example Value</span>
                    <p className="font-mono text-slate-900 font-semibold">{fg.example_value}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Common Rejection Trap: </span>
                    <span>{fg.pitfall}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Tab 7: Application Tracker */}
      {activeTab === 'tracker' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              Statutory Application Tracker & Status Sync
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Once you submit your application on the official portal, record your Application Reference Number (ARN) here to track review progress and unlock dependent downstream milestones.
            </p>
          </div>

          <form onSubmit={handleSaveStatus} className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Milestone Regulatory Status
              </label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress (Drafting / Awaiting Docs)</option>
                <option value="SUBMITTED">Submitted on Official Portal (Under Department Scrutiny)</option>
                <option value="DONE">Completed & Certificate Approved</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Official Application Reference Number (ARN / Acknowledgement ID)
              </label>
              <input
                type="text"
                placeholder="e.g. GST-2026-AA27091234567 or FSSAI-2026-987654"
                value={statusForm.reference_number}
                onChange={(e) => setStatusForm({ ...statusForm, reference_number: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500">
                Found on the acknowledgment receipt generated upon final fee payment on the official portal.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Internal Operational Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add notes about submission date, inspecting officer contacts, or physical scrutiny dates..."
                value={statusForm.notes}
                onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={submittingStatus}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2"
              >
                {submittingStatus ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save & Sync Status</span>
              </button>
              <Link
                to="/roadmap"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl border border-slate-200 transition"
              >
                Return to Roadmap
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* 11. Quick Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Upload to Document Vault
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Uploading required document: <strong className="text-slate-900">{selectedReqName}</strong>
            </p>

            <form onSubmit={handleQuickUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50 transition">
                <input
                  type="file"
                  id="assistant-quick-upload-file"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <label htmlFor="assistant-quick-upload-file" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                  <span className="text-xs font-semibold text-slate-700 block">
                    {uploadFile ? uploadFile.name : 'Click to select PDF or Image file'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Max size 5 MB • Color scans preferred
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingDoc || !uploadFile}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {uploadingDoc ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Upload & Match</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

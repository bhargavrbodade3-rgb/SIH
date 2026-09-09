import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Modal from './ui/Modal';
import ProgressBar from './ui/ProgressBar';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  Lock,
  RefreshCw,
  FolderPlus
} from 'lucide-react';

export default function StepAssistantModal({
  isOpen,
  onClose,
  step,
  business,
  onStepStatusUpdated
}) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [assistantData, setAssistantData] = useState(null);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'guidance' | 'portal'
  const [copiedKey, setCopiedKey] = useState(null);
  const [seedingDocKey, setSeedingDocKey] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const fetchAssistantDetails = async () => {
    if (!step?.id) return;
    try {
      setLoading(true);
      const res = await api.get(`/roadmap/${step.id}/assistant`);
      setAssistantData(res.data);
      if (step.reference_number) {
        setRefNumber(step.reference_number);
      }
    } catch (err) {
      console.error('Failed to load step assistant data:', err);
      toast.error('Could not load step assistant guidance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && step?.id) {
      setRefNumber(step.reference_number || '');
      fetchAssistantDetails();
    }
  }, [isOpen, step?.id]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSeedDocument = async (requirementName) => {
    if (!business?.id) return;
    try {
      setSeedingDocKey(requirementName);
      let docKey = 'water_report';
      const lower = requirementName.toLowerCase();
      if (lower.includes('rent') || lower.includes('lease')) {
        docKey = 'rent_agreement';
      } else if (lower.includes('landlord') || lower.includes('consent') || lower.includes('noc')) {
        docKey = 'landlord_noc';
      } else if (lower.includes('electricity') || lower.includes('utility') || lower.includes('power')) {
        docKey = 'electricity_bill';
      } else if (lower.includes('bank') || lower.includes('cheque')) {
        docKey = 'bank_proof';
      } else if (lower.includes('signatory') || lower.includes('aadhaar') || lower.includes('identity')) {
        docKey = 'signatory_id';
      }

      const formData = new FormData();
      formData.append('business_id', business.id);
      formData.append('doc_key', docKey);

      await api.post('/documents/seed-sample-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Generated & matched sample document in Document Vault!`);
      // Re-fetch assistant details to recalculate live readiness
      await fetchAssistantDetails();
      if (onStepStatusUpdated) onStepStatusUpdated();
    } catch (err) {
      console.error('Failed to seed document:', err);
      toast.error(err.response?.data?.detail || 'Failed to generate sample document.');
    } finally {
      setSeedingDocKey(null);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!step?.id) return;
    try {
      setUpdatingStatus(true);
      const payload = {
        status: newStatus,
        reference_number: refNumber.trim() || null
      };
      const res = await api.put(`/roadmap/${step.id}/status`, payload);
      toast.success(res.data.message || 'Status updated successfully!');
      if (onStepStatusUpdated) {
        await onStepStatusUpdated();
      }
      onClose();
    } catch (err) {
      console.error('Failed to update step status:', err);
      toast.error(err.response?.data?.detail || 'Failed to update step status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!isOpen || !step) return null;

  const readiness = assistantData?.document_readiness;
  const score = readiness?.readiness_percentage ?? 0;
  const isAllReady = score >= 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            {step.step_order}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">{step.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                {step.code}
              </span>
            </div>
          </div>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{step.issuing_authority}</span>
        </div>
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Dynamic Context Header */}
        <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md font-semibold bg-white text-indigo-700 border border-indigo-100 shadow-2xs">
              Sector: {assistantData?.sector || business?.sector || 'General Industry'}
            </span>
            <span className="px-2 py-0.5 rounded-md font-semibold bg-white text-slate-700 border border-slate-200 shadow-2xs">
              Premises: {assistantData?.premises_type || business?.premises_type || 'RENTED'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 font-medium">
            <span>⏱ SLA: {step.typical_timeline_days} days</span>
            <span>💰 Govt Fee: {step.typical_cost}</span>
          </div>
        </div>

        {/* Linked Statutory Application Status Banner (if exists) */}
        {assistantData?.linked_application && (
          <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="font-bold text-blue-950">Statutory Application: </span>
                <span className="font-mono font-bold text-blue-800">{assistantData.linked_application.application_number}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                assistantData.linked_application.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {assistantData.linked_application.status}
              </span>
              {assistantData.linked_application.certificate_number && (
                <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-mono font-bold">
                  Cert: {assistantData.linked_application.certificate_number}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {assistantData.linked_application.sla_days_remaining !== null && assistantData.linked_application.sla_days_remaining !== undefined && (
                <span className="text-[11px] text-slate-600 font-medium">
                  SLA: <strong className="text-slate-800">{assistantData.linked_application.sla_days_remaining}d remaining</strong>
                </span>
              )}
              <Link
                to={`/applications/${assistantData.linked_application.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                <span>Track Application</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'documents'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Document Readiness
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
              isAllReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {score}%
            </span>
          </button>
          <button
            onClick={() => setActiveTab('guidance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'guidance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Field-by-Field Guidance & Auto-Fill
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {assistantData?.field_guidance?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('portal')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
              activeTab === 'portal'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Portal & Filing Steps
          </button>
        </div>

        {/* TAB 1: DOCUMENT READINESS */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Score Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Statutory Document Readiness Score
                  </span>
                  {isAllReady ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      100% Ready to Submit
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Action Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Evaluated against your business premises structure ({assistantData?.premises_type || 'RENTED'}) and verified Document Vault records.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-3xl font-extrabold text-emerald-400">{score}%</span>
                <p className="text-[11px] text-slate-400">Vault Match Rate</p>
              </div>
            </div>

            <ProgressBar
              value={score}
              max={100}
              size="md"
              showLabel={false}
            />

            {/* Checklist items */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mandatory & Supporting Document Checklist
                </h4>
                <span className="text-xs text-slate-500">
                  {readiness?.requirements_status?.filter(r => r.status === 'MATCHED').length || 0} of {readiness?.requirements_status?.length || 0} Matched
                </span>
              </div>

              {loading ? (
                <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  Calculating real-time document readiness...
                </div>
              ) : (
                readiness?.requirements_status?.map((item, idx) => {
                  const isMatched = item.status === 'MATCHED';
                  const isSeeding = seedingDocKey === item.required_name;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isMatched
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isMatched ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-slate-900">
                              {item.required_name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                              {item.category}
                            </span>
                            {item.is_mandatory && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                Mandatory
                              </span>
                            )}
                          </div>

                          {isMatched ? (
                            <p className="text-[11px] text-emerald-800 flex items-center gap-1.5 pl-6">
                              <span>✓ Matched in Vault:</span>
                              <span className="font-semibold">{item.matched_document?.original_name || item.matched_document?.filename}</span>
                              {item.matched_document?.doc_number && (
                                <code className="text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded font-mono">
                                  {item.matched_document.doc_number}
                                </code>
                              )}
                            </p>
                          ) : (
                            <p className="text-[11px] text-amber-800 pl-6">
                              {item.reason || 'Document required for statutory filing. Not found in your Document Vault.'}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                          {isMatched ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <Check className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSeedDocument(item.required_name)}
                              disabled={isSeeding}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition shadow-2xs"
                              title="Instantly generate an authentic demo sample document and match it in your vault"
                            >
                              {isSeeding ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  Seeding...
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  Seed Sample Document
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FIELD-BY-FIELD GUIDANCE */}
        {activeTab === 'guidance' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Government Portal Form Helper:</span> We have pre-mapped all required fields for this statutory application from your registered enterprise profile. Click "Copy" on any value to paste directly into the official portal.
              </div>
            </div>

            <div className="space-y-3">
              {assistantData?.field_guidance?.map((field, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{field.label}</span>
                      <code className="ml-2 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        {field.field_key}
                      </code>
                    </div>

                    {field.auto_fill_suggestion && (
                      <button
                        onClick={() => handleCopy(field.auto_fill_suggestion, field.field_key)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition shrink-0"
                      >
                        {copiedKey === field.field_key ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-500" />
                            Copy Value
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {field.help_text}
                  </p>

                  {field.auto_fill_suggestion && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 break-all">
                      <span className="text-slate-400 select-none mr-2">Value:</span>
                      {field.auto_fill_suggestion}
                    </div>
                  )}

                  {field.caution && (
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{field.caution}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PORTAL & FILING STEPS */}
        {activeTab === 'portal' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Official Designated Portal
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {step.description}
              </p>
              <div className="pt-2">
                <a
                  href={step.official_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                >
                  Open Official Government Portal <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Checklist */}
            {assistantData?.checklist && assistantData.checklist.length > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Pre-Submission Action Checklist
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {assistantData.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Single Window Link if applicable */}
            {step.approval_id && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">
                    Integrated Single Window Clearance Form Available
                  </h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    You can also apply for this approval directly within this platform's Single Window System.
                  </p>
                </div>
                <Link
                  to={`/approvals/${step.approval_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
                >
                  Go to Form <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* MODAL FOOTER: QUICK STATUS CONTROLS & REFERENCE NUMBER */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              Official Reference No. / Acknowledgement (ARN / Udyam / GSTIN):
            </label>
            <input
              type="text"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              className="w-full sm:max-w-xs px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={() => handleUpdateStatus('IN_PROGRESS')}
              disabled={updatingStatus || step.is_locked}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-50"
            >
              Mark In Progress
            </button>
            <button
              onClick={() => handleUpdateStatus('DONE')}
              disabled={updatingStatus || step.is_locked}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Mark Completed & Unlock
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

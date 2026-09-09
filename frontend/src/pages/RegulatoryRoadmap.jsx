import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import ProgressBar from '../components/ui/ProgressBar';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import StepAssistantModal from '../components/StepAssistantModal';
import api from '../api/client';
import {
  CheckCircle2,
  Clock,
  Lock,
  ExternalLink,
  Building2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileText,
  Tag,
  Info,
  Edit2,
  Check,
  RefreshCw,
  Layers,
  ChevronRight,
  Send,
  Milestone
} from 'lucide-react';

export default function RegulatoryRoadmap() {
  const { business } = useAuth();
  const toast = useToast();

  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStepId, setUpdatingStepId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [editingRefId, setEditingRefId] = useState(null);
  const [refInputValues, setRefInputValues] = useState({});
  const [activeStepForModal, setActiveStepForModal] = useState(null);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await api.get('/roadmap');
      setRoadmapData(res.data);
      // Pre-fill reference input state
      const initialRefs = {};
      if (res.data?.steps) {
        res.data.steps.forEach((s) => {
          initialRefs[s.id] = s.reference_number || '';
        });
        // Keep active modal step data fresh if open
        setActiveStepForModal((current) => {
          if (!current) return null;
          return res.data.steps.find((s) => s.id === current.id) || current;
        });
      }
      setRefInputValues(initialRefs);
    } catch (err) {
      console.error('Error fetching roadmap:', err);
      toast.error('Failed to load regulatory roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleStatusChange = async (stepId, newStatus, currentRef) => {
    try {
      setUpdatingStepId(stepId);
      const payload = {
        status: newStatus,
        reference_number: refInputValues[stepId] || currentRef || null,
      };

      const res = await api.put(`/roadmap/${stepId}/status`, payload);
      toast.success(res.data.message || 'Roadmap step updated successfully!');
      // Re-fetch roadmap to refresh dependent unlock statuses
      await fetchRoadmap();
    } catch (err) {
      console.error('Failed to update step status:', err);
      toast.error(err.response?.data?.detail || 'Failed to update step status.');
    } finally {
      setUpdatingStepId(null);
    }
  };

  const handleSaveReference = async (stepId, currentStatus) => {
    try {
      setUpdatingStepId(stepId);
      const payload = {
        status: currentStatus === 'LOCKED' ? 'NOT_STARTED' : currentStatus,
        reference_number: refInputValues[stepId]?.trim() || null,
      };
      await api.put(`/roadmap/${stepId}/status`, payload);
      toast.success('Registration reference number saved!');
      setEditingRefId(null);
      await fetchRoadmap();
    } catch (err) {
      console.error('Failed to save reference number:', err);
      toast.error('Failed to save reference number.');
    } finally {
      setUpdatingStepId(null);
    }
  };

  if (loading && !roadmapData) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <PageHeader
          title="Regulatory Roadmap"
          subtitle="Your end-to-end statutory compliance journey from foundational entity setup to post-approval operations."
          breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Roadmap' }]}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const steps = roadmapData?.steps || [];
  const summary = roadmapData?.summary || {
    total_steps: 11,
    completed_steps: 0,
    in_progress_steps: 0,
    locked_steps: 0,
    completion_percentage: 0,
  };
  const nextStep = roadmapData?.next_step;

  const filteredSteps = steps.filter((step) => {
    if (filterCategory === 'ALL') return true;
    return step.category === filterCategory;
  });

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'FOUNDATIONAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            Foundational Entity
          </span>
        );
      case 'SECTOR_SPECIFIC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Sector Clearance
          </span>
        );
      case 'POST_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Post-Approval / CTO
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status, isLocked) => {
    if (isLocked) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-300">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          Locked
        </span>
      );
    }
    switch (status) {
      case 'DONE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            In Progress
          </span>
        );
      case 'NOT_STARTED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* 1. Header with Breadcrumbs & Action */}
      <PageHeader
        title="Entrepreneur Regulatory Roadmap"
        subtitle={`Dynamic compliance pipeline tailored for ${roadmapData?.sector || 'your sector'} (${roadmapData?.premises_type || 'Rented'} premises). All milestones ordered by statutory prerequisites.`}
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Roadmap' }]}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure Profile</span>
            </Link>
            <button
              onClick={fetchRoadmap}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* 2. Top Progress & Milestone Overview */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Overall Compliance Journey Progress
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                {summary.completed_steps} of {summary.total_steps} Completed
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              {roadmapData?.business_name || 'Your Enterprise'} Statutory Journey
            </h2>
          </div>
          <div className="text-right">
            <span className="text-3xl font-extrabold text-slate-900">
              {summary.percentage_completed || summary.completion_percentage || 0}%
            </span>
            <p className="text-xs text-slate-500">Journey Completion</p>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <ProgressBar
          progress={summary.percentage_completed || summary.completion_percentage || 0}
          height="h-3"
          color="bg-emerald-500"
          showLabel={false}
        />

        {/* Quick KPI stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <span className="text-xs text-slate-500 font-medium">Total Milestones</span>
            <p className="text-lg font-bold text-slate-900 mt-0.5">{summary.total_steps}</p>
          </div>
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-700 font-medium">Completed</span>
            <p className="text-lg font-bold text-emerald-900 mt-0.5">{summary.completed_steps}</p>
          </div>
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-center">
            <span className="text-xs text-blue-700 font-medium">In Progress</span>
            <p className="text-lg font-bold text-blue-900 mt-0.5">{summary.in_progress_steps}</p>
          </div>
          <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-300 text-center">
            <span className="text-xs text-slate-600 font-medium">Locked (Pending Deps)</span>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{summary.locked_steps}</p>
          </div>
        </div>

        {/* Statutory fee disclaimer */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Statutory Transparency Disclaimer:</span> All fee figures shown are approximate official government statutory fees only (subject to prevailing state notification schedules). Professional and chartered accountant fees are not included. Departmental portal links direct to genuine State and Central Government regulatory single-window systems.
          </div>
        </div>
      </div>

      {/* 3. Next Actionable Milestone Hero Banner */}
      {nextStep && (
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-2 relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/30 text-sky-300 uppercase tracking-wide border border-sky-400/30 flex items-center gap-1">
                <Milestone className="w-3 h-3 text-sky-400" />
                YOUR NEXT ACTIONABLE STEP
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Step {nextStep.step_order}: {nextStep.name}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {nextStep.description}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
              <span>Timeline: <strong className="text-slate-200">{nextStep.typical_timeline_days} days</strong></span>
              <span>Govt. Fee: <strong className="text-slate-200">{nextStep.typical_cost}</strong></span>
              {nextStep.readiness_score !== undefined && (
                <span className="text-sky-300 font-semibold">
                  Vault Readiness: {nextStep.readiness_score}% ({nextStep.missing_documents_count || 0} missing docs)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 relative z-10">
            <Link
              to={`/roadmap/${nextStep.id}/assistant`}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition"
            >
              <span>Open Application Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={nextStep.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm rounded-xl border border-white/20 transition"
            >
              <span>Portal ↗</span>
            </a>
          </div>
        </div>
      )}

      {/* 4. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: `All Steps (${steps.length})` },
          { key: 'FOUNDATIONAL', label: `Foundational Registrations (${steps.filter((s) => s.category === 'FOUNDATIONAL').length})` },
          { key: 'SECTOR_SPECIFIC', label: `Sector Clearances (${steps.filter((s) => s.category === 'SECTOR_SPECIFIC').length})` },
          { key: 'POST_APPROVAL', label: `Post-Approval (${steps.filter((s) => s.category === 'POST_APPROVAL').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterCategory(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              filterCategory === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Enterprise 2.5D Stepper Vertical Timeline */}
      <div className="relative border-l-2 border-indigo-100 ml-4 sm:ml-6 pl-4 sm:pl-8 space-y-6">
        {filteredSteps.map((step) => {
          const isDone = step.status === 'DONE';
          const isInProgress = step.status === 'IN_PROGRESS';
          const isLocked = step.is_locked;

          return (
            <div key={step.id} className="relative group">
              {/* Stepper Bubble Marker */}
              <div
                className={`absolute -left-[25px] sm:-left-[41px] top-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition shadow-xs ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isInProgress
                    ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                    : isLocked
                    ? 'bg-slate-200 border-slate-300 text-slate-500'
                    : 'bg-white border-indigo-400 text-indigo-700'
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isInProgress ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : isLocked ? (
                  <Lock className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-xs font-bold">{step.step_order}</span>
                )}
              </div>

              {/* 2.5D Step Card Container with elevation and subtle hover depth */}
              <div
                className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md ${
                  isLocked
                    ? 'bg-slate-50/70 border-slate-200 opacity-75'
                    : isDone
                    ? 'bg-white border-emerald-200/90'
                    : isInProgress
                    ? 'bg-white border-blue-200 ring-1 ring-blue-100'
                    : 'bg-white border-slate-200 hover:border-indigo-200'
                }`}
              >
                {/* Header: Number, Badges, Name */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500 tracking-wider">
                        STEP {step.step_order.toString().padStart(2, '0')}
                      </span>
                      {getCategoryBadge(step.category)}
                      {getStatusBadge(step.status, isLocked)}
                      {step.readiness_score !== undefined && (
                        <button
                          type="button"
                          onClick={() => setActiveStepForModal(step)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer hover:shadow-2xs ${
                            step.readiness_score === 100
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="Click to view required documents and real-time vault readiness"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>Vault: {step.readiness_score}%</span>
                        </button>
                      )}
                      {step.linked_application && (
                        <Link
                          to={`/applications/${step.linked_application.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
                          title="Linked Statutory Application"
                        >
                          <FileText className="w-3 h-3" />
                          <span>App: {step.linked_application.application_number} ({step.linked_application.status})</span>
                        </Link>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {step.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{step.issuing_authority}</span>
                    </div>
                  </div>

                  {/* Top-right Actions: Assistant Modal, Full Guide & Official Portal */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setActiveStepForModal(step)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                      title="Open Step Assistant Modal (Checklist, Auto-Fill & Readiness)"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Step Assistant</span>
                    </button>
                    <Link
                      to={`/roadmap/${step.id}/assistant`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200/80 transition"
                      title="Open full interactive Application Assistant page"
                    >
                      <span>Full Guide</span>
                      <ArrowRight className="w-3 h-3 text-indigo-500" />
                    </Link>
                    {step.official_portal_url && (
                      <a
                        href={step.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300/80 transition"
                        title="Open official government portal"
                      >
                        <span>Portal</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Plain-language Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Metadata Pill Box: SLA Timeline, Statutory Fees, Dependencies */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs mb-4">
                  <div>
                    <span className="text-slate-500 block font-medium">Estimated SLA Timeline</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">
                      ⏱ {step.typical_timeline_days} {step.typical_timeline_days.includes('day') ? '' : 'days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Statutory Govt. Fee</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block truncate" title="Statutory government fee only (approx.)">
                      💰 {step.typical_cost}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Prerequisites</span>
                    {step.depends_on_codes && step.depends_on_codes.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {step.depends_on_codes.map((depCode) => (
                          <span
                            key={depCode}
                            className="px-1.5 py-0.5 bg-slate-200/70 text-slate-700 text-[10px] font-semibold rounded"
                          >
                            {depCode}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-semibold mt-0.5 block">
                        ✓ None (Direct)
                      </span>
                    )}
                  </div>
                </div>

                {/* Dependency Warning if Locked */}
                {isLocked && step.unmet_dependencies && step.unmet_dependencies.length > 0 && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Locked Step:</span> This clearance requires you to complete the following prerequisite foundational registration(s) first:
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800 font-medium">
                        {step.unmet_dependencies.map((dep, idx) => (
                          <li key={idx}>{dep}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Reference Number & Status Control Row */}
                <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Reference Number Section */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">
                        Official Reference / Registration No:
                      </span>
                      {step.reference_number && editingRefId !== step.id && (
                        <button
                          onClick={() => setEditingRefId(step.id)}
                          className="text-indigo-600 hover:text-indigo-800 p-1"
                          title="Edit Reference Number"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {editingRefId === step.id || !step.reference_number ? (
                      <div className="flex items-center gap-2 mt-1.5 max-w-sm">
                        <input
                          type="text"
                          placeholder="e.g. Udyam No / GSTIN / PAN"
                          value={refInputValues[step.id] || ''}
                          onChange={(e) =>
                            setRefInputValues({
                              ...refInputValues,
                              [step.id]: e.target.value,
                            })
                          }
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden w-full"
                        />
                        <button
                          onClick={() => handleSaveReference(step.id, step.status)}
                          disabled={updatingStepId === step.id}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg shrink-0 transition"
                        >
                          Save
                        </button>
                        {editingRefId === step.id && (
                          <button
                            onClick={() => setEditingRefId(null)}
                            className="px-2 py-1 text-slate-500 text-xs hover:text-slate-800"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono bg-slate-100 text-slate-900 px-2.5 py-0.5 rounded border border-slate-200">
                          {step.reference_number}
                        </code>
                        {step.completed_at && (
                          <span className="text-[11px] text-slate-400">
                            (Verified on {new Date(step.completed_at).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status Selector Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-slate-600">Update Status:</span>
                    {isLocked ? (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-medium rounded-lg cursor-not-allowed border border-slate-200 flex items-center gap-1.5"
                      >
                        <Lock className="w-3 h-3" /> Locked
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStatusChange(step.id, 'NOT_STARTED', step.reference_number)}
                          disabled={updatingStepId === step.id || step.status === 'NOT_STARTED'}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                            step.status === 'NOT_STARTED'
                              ? 'bg-slate-800 text-white font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          Not Started
                        </button>
                        <button
                          onClick={() => handleStatusChange(step.id, 'IN_PROGRESS', step.reference_number)}
                          disabled={updatingStepId === step.id || step.status === 'IN_PROGRESS'}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                            step.status === 'IN_PROGRESS'
                              ? 'bg-blue-600 text-white font-semibold shadow-xs'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleStatusChange(step.id, 'DONE', step.reference_number)}
                          disabled={updatingStepId === step.id || step.status === 'DONE'}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            step.status === 'DONE'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                          }`}
                        >
                          ✓ Mark Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Step Assistant Modal */}
      {activeStepForModal && (
        <StepAssistantModal
          isOpen={!!activeStepForModal}
          onClose={() => setActiveStepForModal(null)}
          step={activeStepForModal}
          business={business}
          onStepStatusUpdated={fetchRoadmap}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Search, CheckCircle2, Clock, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function GrievancesPage() {
  const { role } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Delay in Approval Processing');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');

  const toast = useToast();

  useEffect(() => {
    fetchGrievances();
  }, []);

  const fetchGrievances = async () => {
    setLoading(true);
    try {
      const res = await api.get('/grievances');
      setGrievances(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load grievance records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error('Please enter both a subject and details for your grievance.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/grievances', {
        subject,
        category,
        priority,
        description,
      });
      toast.success(res.data.message || 'Grievance ticket registered!');
      setModalOpen(false);
      setSubject('');
      setDescription('');
      fetchGrievances();
    } catch (err) {
      console.error(err);
      toast.error('Failed to register grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = grievances.filter((g) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      g.ticket_number?.toLowerCase().includes(s) ||
      g.subject?.toLowerCase().includes(s) ||
      g.category?.toLowerCase().includes(s) ||
      g.description?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Support & Regulatory Grievance Redressal"
        subtitle="Formal statutory grievance mechanism for reporting procedural bottlenecks, inspection disputes, or portal discrepancies."
        breadcrumbs={[
          { label: 'Portal', href: '/' },
          { label: 'Grievances' },
        ]}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Lodge New Grievance</span>
          </button>
        }
      />

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket #, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Official SLA: Initial regulatory response guaranteed within 48 business hours.
        </div>
      </div>

      {/* Grievances List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">Ticket Reference</th>
                <th className="py-3 px-4">Subject & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status & Assigned Desk</th>
                <th className="py-3 px-4">Logged Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <EmptyState
                      icon={HelpCircle}
                      title="No Grievance Tickets"
                      description="You currently have no active or historical grievances registered with the department."
                      actionLabel="Lodge New Grievance"
                      onAction={() => setModalOpen(true)}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((g) => {
                  const isResolved = g.status === 'RESOLVED' || g.status === 'CLOSED';
                  return (
                    <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-indigo-700 whitespace-nowrap">
                        {g.ticket_number}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-semibold text-slate-900">{g.subject}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{g.description}</p>
                        {g.resolution_notes && (
                          <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800">
                            <span className="font-bold">Resolution: </span>
                            {g.resolution_notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-xs font-medium text-slate-700">
                          {g.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            g.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {g.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          {isResolved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{g.status}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{g.status}</span>
                            </span>
                          )}
                          {g.officer_assigned && (
                            <p className="text-[10px] text-slate-400 mt-1">
                              Desk: {g.officer_assigned}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {g.created_at ? new Date(g.created_at).toLocaleDateString() : 'Today'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Grievance Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Lodge Statutory Grievance Ticket"
        subtitle="Submit your issue directly to the state industrial grievance monitoring cell."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Grievance Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scrutiny delayed beyond statutory SLA deadline"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="Delay in Approval Processing">Delay in Approval Processing</option>
                <option value="Inspection Query Clarification">Inspection Query Clarification</option>
                <option value="Document Rejection Appeal">Document Rejection Appeal</option>
                <option value="Technical Portal Issue">Technical Portal Issue</option>
                <option value="Fee Calculation Dispute">Fee Calculation Dispute</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description & Timeline <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Please provide specific details including application number, fee payment reference, or department communication dates..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition flex items-center gap-2"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>Submit Grievance</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

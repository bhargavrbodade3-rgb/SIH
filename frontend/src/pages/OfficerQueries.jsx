import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareWarning, Search, CheckCircle2, Clock, ArrowRight, Filter, AlertCircle } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function OfficerQueries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/queries');
      setQueries(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueries = queries.filter((q) => {
    const matchesFilter = filterStatus === 'ALL' || q.status === filterStatus;
    const matchesSearch =
      q.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.query_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.business_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Regulatory Queries Management"
        subtitle="Track official clarifications and document defect inquiries raised with industrial applicants."
        breadcrumbs={[
          { label: 'Officer Portal', href: '/officer' },
          { label: 'Queries' },
        ]}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by query subject, app ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'PENDING', 'RESPONDED', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Queries' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Queries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">Query Details</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Applicant Unit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Raised</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <>
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                  <TableRowSkeleton cols={6} />
                </>
              ) : filteredQueries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <EmptyState
                      icon={MessageSquareWarning}
                      title="No Queries Found"
                      description="No regulatory clarification queries match your current filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filteredQueries.map((q) => {
                  let badge = 'bg-amber-50 text-amber-700 border-amber-200';
                  let icon = <Clock className="w-3 h-3 text-amber-600" />;
                  if (q.status === 'RESPONDED') {
                    badge = 'bg-sky-50 text-sky-700 border-sky-200';
                    icon = <AlertCircle className="w-3 h-3 text-sky-600" />;
                  } else if (q.status === 'RESOLVED') {
                    badge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    icon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
                  }

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{q.subject}</p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{q.query_text}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {q.application_number || `APP-${q.application_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {q.business_name || 'Demo Food Processing Unit'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badge}`}>
                          {icon}
                          <span>{q.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {q.created_at ? new Date(q.created_at).toLocaleDateString() : 'Active'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to={`/officer/applications/${q.application_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

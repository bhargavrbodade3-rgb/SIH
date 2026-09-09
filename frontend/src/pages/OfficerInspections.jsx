import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Search, CheckCircle2, Clock, ArrowRight, MapPin, UserCheck, ShieldAlert } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function OfficerInspections() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inspections');
      setInspections(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = inspections.filter((ins) => {
    const matchesFilter = filterStatus === 'ALL' || ins.status === filterStatus;
    const matchesSearch =
      ins.officer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.application_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.remarks?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Physical Site Inspections"
        subtitle="Schedule and log factory premises site inspections, verify machinery layout, effluent treatment, and fire safety."
        breadcrumbs={[
          { label: 'Officer Portal', href: '/officer' },
          { label: 'Inspections' },
        ]}
      />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search inspection records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'SCHEDULED', 'COMPLETED', 'PASSED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Inspections' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">Inspection Target</th>
                <th className="py-3 px-4">Application</th>
                <th className="py-3 px-4">Inspecting Officer</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Status & Finding</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <EmptyState
                      icon={CalendarCheck}
                      title="No Inspections Scheduled"
                      description="No physical inspection rounds match your filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((ins) => {
                  const isCompleted = ins.status === 'COMPLETED' || ins.status === 'PASSED';
                  return (
                    <tr key={ins.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">
                          {ins.business_name || 'Demo Food Processing Unit'}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>Pune MIDC Industrial Area</span>
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {ins.application_number || `APP-${ins.application_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{ins.officer_name || 'Dr. Vikram Deshmukh'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                        {ins.scheduled_date ? new Date(ins.scheduled_date).toLocaleDateString() : 'Pending Date'}
                      </td>
                      <td className="py-3.5 px-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{ins.status}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Scheduled</span>
                          </span>
                        )}
                        {ins.remarks && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                            "{ins.remarks}"
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to={`/officer/applications/${ins.application_id}`}
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

import React, { useState, useEffect } from 'react';
import { History, ArrowLeft, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AdminAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        setLogs(res.data.recent_activities || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, []);

  const filtered = logs.filter(l =>
    search === '' ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin" className="hover:text-sky-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Admin Overview</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Audit Trail</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-sky-600" />
            <span>Immutable Regulatory Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic-style audit record of all document uploads, submissions, queries, and officer decisions.
          </p>
        </div>
      </div>

      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter by action, actor, or details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-xs pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-sky-500 shadow-xs"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Timestamp (UTC)</th>
                <th className="px-5 py-3">Actor / User</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-5 py-3 text-slate-500 text-[11px]">
                    {l.created_at}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-800 font-sans">
                    {l.user_name}
                  </td>
                  <td className="px-5 py-3 font-bold text-sky-700">
                    {l.action}
                  </td>
                  <td className="px-5 py-3 text-slate-700 font-sans">
                    {l.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

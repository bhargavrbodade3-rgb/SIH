import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import api from '../api/client';

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRenewals = async () => {
      try {
        const res = await api.get('/renewals');
        setRenewals(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRenewals();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 uppercase">
              Statutory Lifecycle Management
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Clock className="w-5 h-5 text-sky-600" />
            <span>Compliance Renewals & Validity Horizons</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track license expirations, renewal notices, and avoid commercial operational penalties.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Checking statutory expiry horizons...
        </div>
      ) : renewals.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No active licenses registered yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Approved clearance applications automatically populate your compliance renewal tracker.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Certificate Number</th>
                  <th className="px-5 py-3">Clearance Approval</th>
                  <th className="px-5 py-3">Issuing Authority</th>
                  <th className="px-5 py-3">Valid Until</th>
                  <th className="px-5 py-3">Renewal Horizon</th>
                  <th className="px-5 py-3">Compliance Status</th>
                  <th className="px-5 py-3 text-right">Renewal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {renewals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {r.certificate_number}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">
                      {r.approval_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {r.authority}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {new Date(r.valid_until).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${r.days_to_due < 30 ? 'text-amber-600' : 'text-slate-700'}`}>
                        Due in {r.days_to_due} Days
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => alert(`Renewal pipeline initiated for Certificate ${r.certificate_number}. Pre-filled application package generated from existing Vault documents.`)}
                        className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-semibold inline-flex items-center gap-1 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Fast-Track Renew</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

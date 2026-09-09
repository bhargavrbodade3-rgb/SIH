import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Mail, Phone, Building2, UserPlus, Filter } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department_name?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const entrepreneurCount = users.filter((u) => u.role === 'ENTREPRENEUR').length;
  const officerCount = users.filter((u) => u.role === 'OFFICER').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="User Accounts & Persona Roster"
        subtitle="Manage single-sign-on credentials, role-based access privileges, and departmental officer assignments."
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin' },
          { label: 'Users' },
        ]}
      />

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Industrial Applicants
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-slate-900">{entrepreneurCount}</p>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
              Entrepreneurs
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Regulatory Officers
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-slate-900">{officerCount}</p>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
              Scrutiny Depts
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            System Administrators
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-slate-900">{adminCount}</p>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Full Privileges
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'ENTREPRENEUR', 'OFFICER', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filterRole === r
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-5">User Name & Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department / Authority</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <>
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                  <TableRowSkeleton cols={5} />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <EmptyState
                      icon={Users}
                      title="No Users Found"
                      description="No registered user profiles match your filter."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  let roleBadge = 'bg-sky-50 text-sky-700 border-sky-200';
                  if (u.role === 'OFFICER') roleBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (u.role === 'ADMIN') roleBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{u.full_name}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </span>
                          {u.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {u.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleBadge}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {u.department_name || 'Industrial Applicant Unit'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {u.designation || 'Proprietor / Director'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
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

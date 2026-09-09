import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserCheck, Briefcase, UserCog } from 'lucide-react';

export default function DemoBanner() {
  const { user, role, switchRole } = useAuth();

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30 tracking-wide uppercase">
          <ShieldAlert className="w-3.5 h-3.5" />
          Prototype Mode
        </span>
        <span className="text-slate-300 font-medium hidden sm:inline">
          DEMO REGULATORY DATA — FOR PROTOTYPE DEMONSTRATION ONLY
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-slate-400 font-medium mr-1">Switch Persona:</span>
        
        <button
          onClick={() => switchRole('ENTREPRENEUR')}
          className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
            role === 'ENTREPRENEUR'
              ? 'bg-sky-600 text-white font-semibold shadow-sm ring-1 ring-sky-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Login as Rajesh Sharma (Demo Food Processing Unit)"
        >
          <Briefcase className="w-3 h-3" />
          <span>Entrepreneur</span>
        </button>

        <button
          onClick={() => switchRole('OFFICER')}
          className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
            role === 'OFFICER'
              ? 'bg-amber-600 text-white font-semibold shadow-sm ring-1 ring-amber-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Login as Dr. Vikram Deshmukh (Senior Food Safety Officer)"
        >
          <UserCheck className="w-3 h-3" />
          <span>Officer</span>
        </button>

        <button
          onClick={() => switchRole('ADMIN')}
          className={`px-2.5 py-1 rounded transition flex items-center gap-1.5 ${
            role === 'ADMIN'
              ? 'bg-emerald-600 text-white font-semibold shadow-sm ring-1 ring-emerald-400'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title="Login as Priya Nair (System Admin & Analytics)"
        >
          <UserCog className="w-3 h-3" />
          <span>Admin</span>
        </button>
      </div>
    </div>
  );
}

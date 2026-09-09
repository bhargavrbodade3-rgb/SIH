import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CheckCircle, Award, Building2, HelpCircle, ArrowRight, X } from 'lucide-react';
import api from '../api/client';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Quick navigation options
  const defaultItems = [
    { type: 'Navigation', title: 'Business Profile', desc: 'Manage factory information & MSME status', path: '/profile', icon: Building2 },
    { type: 'Navigation', title: 'Find Approvals', desc: 'AI regulatory rule engine discovery', path: '/approvals', icon: CheckCircle },
    { type: 'Navigation', title: 'Document Vault', desc: 'Secure repository with OCR verification', path: '/documents', icon: FileText },
    { type: 'Navigation', title: 'My Applications', desc: 'Track single-window submissions & status', path: '/applications', icon: FileText },
    { type: 'Navigation', title: 'Recommended Schemes', desc: 'Incentives & subsidies for food processing', path: '/schemes', icon: Award },
    { type: 'Navigation', title: 'Support & Grievances', desc: 'Submit grievance or view existing tickets', path: '/grievances', icon: HelpCircle },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults(defaultItems);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(true); // toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearchChange = async (val) => {
    setQuery(val);
    if (!val.trim()) {
      setResults(defaultItems);
      return;
    }

    const q = val.toLowerCase();
    setLoading(true);

    try {
      // Local filter + API search if needed
      const matches = defaultItems.filter(
        (item) => item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
      );

      // Search approvals
      const { data: approvals } = await api.get('/approvals');
      const matchedApprovals = (approvals || [])
        .filter((a) => a.name.toLowerCase().includes(q) || a.department_name.toLowerCase().includes(q))
        .map((a) => ({
          type: 'Approval',
          title: a.name,
          desc: a.department_name,
          path: `/approvals/${a.id}`,
          icon: CheckCircle,
        }));

      // Search documents
      const { data: documents } = await api.get('/documents');
      const matchedDocs = (documents || [])
        .filter((d) => d.name.toLowerCase().includes(q) || (d.doc_type && d.doc_type.toLowerCase().includes(q)))
        .map((d) => ({
          type: 'Document',
          title: d.name,
          desc: `Status: ${d.status} • ${d.doc_type || 'Statutory Document'}`,
          path: '/documents',
          icon: FileText,
        }));

      // Search applications
      const { data: apps } = await api.get('/applications');
      const matchedApps = (apps || [])
        .filter((app) => app.approval_name.toLowerCase().includes(q) || app.application_number.toLowerCase().includes(q))
        .map((app) => ({
          type: 'Application',
          title: app.approval_name,
          desc: `Ref: ${app.application_number} • Status: ${app.status}`,
          path: `/applications/${app.id}`,
          icon: FileText,
        }));

      setResults([...matchedApprovals, ...matchedApps, ...matchedDocs, ...matches]);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (path) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search approvals, applications, documents, schemes... (Esc to close)"
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
          />
          {query && (
            <button
              onClick={() => handleSearchChange('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching compliance registry...
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No matching approvals, applications or documents found.
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, idx) => {
                const Icon = item.icon || FileText;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-2" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

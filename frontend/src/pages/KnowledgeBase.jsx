import React, { useState, useEffect } from 'react';
import { BookOpen, Search, FileText, Clock, IndianRupee, ShieldCheck, ChevronRight } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/ui/PageHeader';
import { CardSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function KnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      const res = await api.get('/knowledge-base', { params });
      setArticles(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = articles.filter((a) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.title.toLowerCase().includes(s) ||
      a.department.toLowerCase().includes(s) ||
      a.summary.toLowerCase().includes(s)
    );
  });

  const categories = [
    'ALL',
    'Food Safety',
    'Pollution Control',
    'Industrial Safety & DISH',
    'Fire Safety',
    'Industrial Development',
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Regulatory Knowledge Base & Acts"
        subtitle="Authoritative guide to Maharashtra state industrial licensing rules, statutory timelines, fees, and documentation checklists."
        breadcrumbs={[
          { label: 'Portal', href: '/' },
          { label: 'Knowledge Base' },
        ]}
      />

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rules, acts, departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Regulations' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Regulatory Documents Found"
          description="Try searching with other keywords or reset your category filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400">Updated: {item.updated_at}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs font-medium text-indigo-600 mt-1">{item.department}</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                  {item.summary}
                </p>

                {/* Key Documents Required */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Statutory Document Requirements:</span>
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {item.key_documents.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>SLA: {item.timeline_days} Days</span>
                </div>
                <div className="flex items-center gap-1 font-medium text-slate-700">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  <span>Scale-Based Fees</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

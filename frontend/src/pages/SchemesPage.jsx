import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Gift, Sparkles, CheckCircle2, ArrowRight, ExternalLink, IndianRupee, ShieldCheck } from 'lucide-react';
import api from '../api/client';

export default function SchemesPage() {
  const { business } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await api.get('/schemes/recommendations', {
          params: { business_id: business?.id }
        });
        setRecommendations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, [business]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
              AI Subsidy Matching Engine
            </span>
            <span className="text-xs text-slate-500">{business?.sector} Sector</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Gift className="w-5 h-5 text-emerald-600" />
            <span>Government Capital Subsidies & Schemes</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Matched against your verified enterprise investment, employment size, and industrial sector.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-center">
          <span className="text-lg font-black text-emerald-700">₹5+ Crore</span>
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Potential Capital Grants</span>
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
        <span><strong>DEMO SCHEME DATA</strong> — Compiled for SIH demonstration. Integrated with National Single Window Scheme Registry.</span>
      </div>

      {/* Recommendations Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Matching enterprise profile against central & state schemes...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recommendations.map((rec) => {
            const s = rec.scheme;
            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 transition space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>{rec.match_score}% Profile Match</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-600">{s.ministry}</span>
                      <span className="text-[11px] text-slate-400">• Deadline: {s.deadline}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{s.benefits_summary}</p>

                    {/* Match Reasons */}
                    <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100/80 space-y-1">
                      <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Eligibility Match Factors:</span>
                      </p>
                      <ul className="text-xs text-emerald-950 space-y-0.5 pl-5 list-disc">
                        {rec.match_reasons.map((mr, idx) => (
                          <li key={idx}>{mr}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Required Documents */}
                    {rec.required_documents_list.length > 0 && (
                      <div className="pt-2 text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Required Grant Attachments: </span>
                        <span>{rec.required_documents_list.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Benefit Callout */}
                  <div className="shrink-0 flex flex-col items-start lg:items-end justify-between space-y-3 min-w-[200px]">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left lg:text-right w-full">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Potential Grant Subsidy</span>
                      <span className="text-sm font-black text-emerald-700 block mt-0.5">{rec.potential_benefit}</span>
                    </div>

                    <a
                      href={s.application_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
                    >
                      <span>Apply on Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

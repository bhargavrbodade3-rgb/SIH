import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Send, Sparkles, Bot, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AIChatDrawer({ isOpen, onClose }) {
  const { business } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am your **AI Industrial Compliance Advisor**, grounded in your business record and statutory clearance rules.\n\nAsk me about required statutory documents, missing clearances, query responses, or government subsidies.",
      source: "STATUTORY COMPLIANCE KNOWLEDGEBASE"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg,
        business_id: business?.id
      });
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.data.reply,
          actionSuggestion: res.data.action_suggestion,
          actionLink: res.data.action_link,
          source: res.data.source
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "I am having trouble connecting to the compliance engine right now. Please verify backend connectivity.",
          source: "SYSTEM"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What approvals apply to my business?",
    "Which documents are missing for FSSAI?",
    "Why is my application not ready?",
    "What should I do about the officer query?"
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">AI Compliance Advisor</h3>
              <p className="text-[11px] text-slate-500">Grounded Statutory Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Advisory banner */}
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 text-[10px] text-amber-800 font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Answers are grounded in active application data. Demo prototype use only.</span>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-sky-100 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0 text-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 border border-slate-200/80 shadow-xs'
              }`}>
                <div className="whitespace-pre-line">{m.text}</div>

                {m.actionSuggestion && m.actionLink && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200">
                    <Link
                      to={m.actionLink}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-600 text-white font-medium text-[11px] hover:bg-sky-700 transition"
                    >
                      <span>{m.actionSuggestion}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {m.source && (
                  <div className="mt-1.5 text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                    {m.source}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></div>
              <span>Grounding compliance parameters...</span>
            </div>
          )}
        </div>

        {/* Suggested prompts */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex gap-1.5 overflow-x-auto">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setInput(q)}
              className="text-[10px] whitespace-nowrap bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-600 hover:border-sky-300 hover:text-sky-600 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Compliance Advisor..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

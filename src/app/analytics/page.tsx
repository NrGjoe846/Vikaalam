'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Send,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ShieldAlert,
  Users,
  Bike,
} from 'lucide-react';
import { formatINR, formatCompactINR } from '@/lib/utils';

interface QueryQA {
  query: string;
  response: string;
  breakdown?: { label: string; value: string; percent: number }[];
  timestamp: string;
}

const SAMPLE_QUERIES: QueryQA[] = [
  {
    query: 'Why are we losing leads this month?',
    response:
      'Root cause analysis across 84 dropouts indicates that 38% are due to pricing objections where customer expectations exceeded fair market ceiling, followed by slow response time during peak hours (27%).',
    breakdown: [
      { label: 'Price Objection (Market Gap)', value: '32 leads', percent: 38 },
      { label: 'Slow Initial Response (>15m)', value: '23 leads', percent: 27 },
      { label: 'Customer Not Ready to Sell', value: '15 leads', percent: 18 },
      { label: 'Competitor Alternate Offer', value: '8 leads', percent: 10 },
      { label: 'Document / Legal Issues', value: '6 leads', percent: 7 },
    ],
    timestamp: 'Today 09:15 AM',
  },
  {
    query: 'Which high-priority leads need executive intervention today?',
    response:
      'There are 3 critical leads requiring manager action: Lead #L10291 (Activa 6G - ₹3k price gap in negotiation), Lead #L10292 (RE Classic 350 - Inspection pending slot allocation in Bangalore), and Lead #L10296 (Pulsar NS200 - Final purchase payout authorization).',
    timestamp: 'Today 09:30 AM',
  },
];

export default function AnalyticsPage() {
  const [qaList, setQaList] = useState<QueryQA[]>(SAMPLE_QUERIES);
  const [queryInput, setQueryInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const handleAskManagerAI = (presetQuery?: string) => {
    const q = presetQuery || queryInput;
    if (!q.trim()) return;

    setIsAnswering(true);
    if (!presetQuery) setQueryInput('');

    setTimeout(() => {
      let reply = `Based on live CRM acquisition metrics across Tamil Nadu & Karnataka branches, our average gross resale margin is ₹14,800 per unit with an 84.2% AI autonomy rate. Lead qualification velocity has improved by 22% this week.`;
      if (q.toLowerCase().includes('conversion') || q.toLowerCase().includes('rate')) {
        reply = `Our current Lead-to-Purchase conversion rate stands at 7.5% (32 bikes purchased from 428 total leads). Top performing branch is Chennai - Anna Nagar at 9.6% conversion.`;
      } else if (q.toLowerCase().includes('margin') || q.toLowerCase().includes('profit')) {
        reply = `Total MTD Gross Profit is ₹4.75 Lakhs across 32 acquired bikes. Highest margin segment: Royal Enfield 350 series (₹22,000 avg margin) and Yamaha MT-15 (₹18,500 avg margin).`;
      }

      setQaList((prev) => [
        {
          query: q,
          response: reply,
          timestamp: 'Just now',
        },
        ...prev,
      ]);
      setIsAnswering(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              MANAGEMENT INTELLIGENCE
            </span>
            <span className="text-xs text-slate-400">Executive KPIs & AI Copilot</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Acquisition Intelligence & AI Manager Copilot</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Real-time conversion funnels, root cause analytics on lost leads, gross margin profitability, and natural-language executive queries.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Lead-to-Purchase Conversion</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">7.5%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">+1.2% above industry avg</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Avg Acquisition Margin</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">₹14,840</div>
          <div className="text-[11px] text-slate-500 mt-1">Target: ₹12,000 / unit</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">AI Override Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">4.8%</div>
          <div className="text-[11px] text-slate-500 mt-1">95.2% guardrail compliance</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">SLA Breach Rate</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">2.4%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Avg 4m 32s response</div>
        </div>
      </div>

      {/* Interactive Manager AI Copilot Section (Section 32) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Manager AI Diagnostic Copilot</h2>
              <p className="text-xs text-slate-500">Ask strategic questions about acquisition performance, bottlenecks, or margins</p>
            </div>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleAskManagerAI('Why are we losing leads this month?')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            "Why are we losing leads?"
          </button>
          <button
            onClick={() => handleAskManagerAI('Which leads need urgent intervention today?')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            "Which leads need urgent attention?"
          </button>
          <button
            onClick={() => handleAskManagerAI('What is our gross margin per bike class?')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            "What is our gross profit per bike category?"
          </button>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskManagerAI()}
            placeholder="Ask executive question (e.g. 'Show conversion by branch', 'Why did RE Classic quotes drop?')..."
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <button
            onClick={() => handleAskManagerAI()}
            disabled={isAnswering}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Query AI</span>
          </button>
        </div>

        {/* QA Stream */}
        <div className="space-y-4 pt-2">
          {qaList.map((qa, index) => (
            <div key={index} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Q: {qa.query}
                </span>
                <span>{qa.timestamp}</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">{qa.response}</p>

              {/* Graphical Breakdown Bar if available */}
              {qa.breakdown && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Root Cause Distribution:</div>
                  <div className="space-y-1.5">
                    {qa.breakdown.map((item, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-700">{item.label}</span>
                          <span className="font-bold text-slate-900">{item.value} ({item.percent}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

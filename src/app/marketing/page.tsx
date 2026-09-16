'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  RefreshCw,
  TrendingUp,
  Target,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { INITIAL_CAMPAIGNS } from '@/lib/store/crm-store';
import { formatINR, formatCompactINR } from '@/lib/utils';
import { Campaign } from '@/types/crm';

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleTriggerReactivation = () => {
    setIsSendingBatch(true);
    setTimeout(() => {
      setIsSendingBatch(false);
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 4000);
    }, 1500);
  };

  const totalMarketingSpend = campaigns.reduce((acc, c) => acc + c.totalSpend, 0);
  const totalNetProfit = campaigns.reduce((acc, c) => acc + c.netGrossProfit, 0);
  const totalPurchasedUnits = campaigns.reduce((acc, c) => acc + c.purchasesCount, 0);
  const overallROI = Math.round((totalNetProfit / Math.max(1, totalMarketingSpend)) * 100);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white p-6 rounded-2xl border border-purple-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              CLOSED-LOOP MARKETING CRM
            </span>
            <span className="text-xs text-purple-200">Reactivation & Acquisition Attribution</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Acquisition Marketing & Reactivation Engine</h1>
          <p className="text-xs text-purple-200 max-w-xl">
            Track full-funnel performance from Meta Ads / WhatsApp campaigns directly to downstream vehicle purchase and resale gross margin.
          </p>
        </div>

        <button
          onClick={handleTriggerReactivation}
          disabled={isSendingBatch}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSendingBatch ? 'animate-spin' : ''}`} />
          <span>{isSendingBatch ? 'Dispatching Batch...' : 'Trigger Parked Reactivation (41 Leads)'}</span>
        </button>
      </div>

      {sentSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Automated WhatsApp reactivation broadcast sent to 41 parked leads with personalized revised valuations!</span>
        </div>
      )}

      {/* Closed Loop Marketing KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Attributed Purchases</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalPurchasedUnits} Bikes</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">From Tracked Campaigns</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Net Gross Resale Profit</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatCompactINR(totalNetProfit)}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Avg ₹12.3K margin / bike</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Campaign Spend</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatINR(totalMarketingSpend)}</div>
          <div className="text-[11px] text-slate-400 mt-1">CAC: ₹622 / bike acquired</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Marketing ROI</div>
          <div className="text-2xl font-bold text-purple-700 mt-1">{overallROI}%</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">19.5x Return on Ad Spend</div>
        </div>
      </div>

      {/* Campaign Attribution Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Campaigns & Full-Funnel Closed-Loop ROI</h3>
            <p className="text-[11px] text-slate-500">Connecting lead generation ads to final resale gross profit</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Campaign & Segment</th>
                <th className="py-3 px-3">Channel</th>
                <th className="py-3 px-3">Sent / Reach</th>
                <th className="py-3 px-3">Responses</th>
                <th className="py-3 px-3">Qualified</th>
                <th className="py-3 px-3">Purchased</th>
                <th className="py-3 px-3">Ad Spend</th>
                <th className="py-3 px-4 text-right">Net Resale Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{camp.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{camp.targetSegment}</div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                      {camp.channel}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">{camp.sentCount.toLocaleString()}</td>
                  <td className="py-3.5 px-3">{camp.responseCount} ({(camp.responseCount / camp.sentCount * 100).toFixed(0)}%)</td>
                  <td className="py-3.5 px-3 text-orange-700 font-bold">{camp.qualifiedCount}</td>
                  <td className="py-3.5 px-3 text-emerald-700 font-bold">{camp.purchasesCount} units</td>
                  <td className="py-3.5 px-3">{formatINR(camp.totalSpend)}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatINR(camp.netGrossProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

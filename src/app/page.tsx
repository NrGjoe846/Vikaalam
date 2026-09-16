'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Bike,
  UserCheck,
  Megaphone,
  RefreshCw,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { INITIAL_LEADS, INITIAL_EMPLOYEES } from '@/lib/store/crm-store';
import { formatINR, formatCompactINR, formatRelativeTime } from '@/lib/utils';
import { PipelineStage, Lead } from '@/types/crm';

const PIPELINE_STEPS: { stage: PipelineStage; label: string; count: number }[] = [
  { stage: '01_NEW_LEAD', label: '01 New', count: 12 },
  { stage: '02_QUALIFICATION', label: '02 Qualify', count: 9 },
  { stage: '03_DETAILS_COLLECTION', label: '03 Specs', count: 8 },
  { stage: '04_DOCUMENT_COLLECTION', label: '04 Docs', count: 6 },
  { stage: '05_PHOTO_COLLECTION', label: '05 Photos', count: 5 },
  { stage: '06_AI_VALUATION', label: '06 Valuation', count: 7 },
  { stage: '07_QUOTE_PENDING', label: '07 Draft', count: 4 },
  { stage: '08_QUOTE_SENT', label: '08 Sent', count: 18 },
  { stage: '09_NEGOTIATION', label: '09 Negotiate', count: 7 },
  { stage: '10_INSPECTION_PENDING', label: '10 Insp. Queue', count: 5 },
  { stage: '11_INSPECTION_SCHEDULED', label: '11 Booked', count: 4 },
  { stage: '12_INSPECTION_COMPLETED', label: '12 Inspected', count: 6 },
  { stage: '13_PURCHASE_APPROVAL', label: '13 Approval', count: 3 },
  { stage: '14_PURCHASED', label: '14 Purchased', count: 32 },
  { stage: '15_INVENTORY', label: '15 Resale Inventory', count: 28 },
];

export default function DashboardPage() {
  const [leads] = useState<Lead[]>(INITIAL_LEADS);

  const totalAcquisitionSpend = 2485000;
  const totalExpectedResale = 2960000;
  const projectedGrossMargin = totalExpectedResale - totalAcquisitionSpend;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> VIKALAAM OS 2.0
            </span>
            <span className="text-xs text-slate-400">Live Operating System</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Used-Bike Acquisition Command Center</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Autonomous qualification, guardrailed valuation, omnichannel WhatsApp sales, field inspection, and employee workload engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pipeline"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <span>Master Pipeline</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/inspector"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all flex items-center gap-2"
          >
            <Bike className="w-4 h-4 text-orange-400" />
            <span>Inspector App</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Purchased Units (MTD)</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Bike className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">32 Bikes</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +24% MoM
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Target: 40 units | Conversion: 7.5%</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gross Resale Margin</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{formatCompactINR(projectedGrossMargin)}</span>
            <span className="text-xs font-semibold text-emerald-600">Avg ₹14.8K / bike</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Total Purchase: {formatCompactINR(totalAcquisitionSpend)}</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">AI Autonomy & SLA Adherence</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">84.2%</span>
            <span className="text-xs font-semibold text-emerald-600">Avg 4m 12s SLA</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">1,240 AI actions logged today</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Parked & Reactivated</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">41 Parked</span>
            <span className="text-xs font-semibold text-purple-600">19 Reactivated</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">“Park is not Lost” recovery rate: 31.8%</div>
        </div>
      </div>

      {/* Complete 15-Stage Master Pipeline Visual Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Master Business Pipeline (15 Granular Stages)</span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                Strict State Machine
              </span>
            </h2>
            <p className="text-xs text-slate-500">End-to-end acquisition lifecycle from inbound inquiry to resale inventory</p>
          </div>
          <Link href="/pipeline" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1">
            <span>View Kanban Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2 pt-2">
          {PIPELINE_STEPS.slice(0, 8).map((step, idx) => (
            <div
              key={step.stage}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/40 transition-colors"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{step.label}</div>
              <div className="text-base font-bold text-slate-800 mt-1 flex items-baseline justify-between">
                <span>{step.count}</span>
                <span className="text-[9px] text-slate-400 font-normal">leads</span>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PIPELINE_STEPS.slice(8).map((step, idx) => (
            <div
              key={step.stage}
              className={`p-2.5 rounded-lg border transition-colors ${
                step.stage === '14_PURCHASED' || step.stage === '15_INVENTORY'
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-slate-50 border-slate-200/80 hover:border-orange-300 hover:bg-orange-50/40'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">{step.label}</div>
              <div className="text-base font-bold text-slate-900 mt-1 flex items-baseline justify-between">
                <span>{step.count}</span>
                <span className="text-[9px] text-slate-400 font-normal">units</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Leads & Workload Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active High-Priority Leads (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Priority Lead Queue & Active Conversations</h3>
              <p className="text-xs text-slate-500">Live omnichannel interactions requiring action</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-orange-100 text-orange-800 rounded-full">
              {leads.length} Active Records
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {leads.map((lead) => {
              const isHot = lead.leadTemperature === 'HOT';
              return (
                <div
                  key={lead.id}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 min-w-[500px]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isHot ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-xs font-bold text-slate-900 hover:text-orange-600 transition-colors"
                        >
                          {lead.customer.name}
                        </Link>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isHot ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {lead.leadTemperature} ({lead.leadScore} pts)
                        </span>
                        <span className="text-[10px] text-slate-400">#{lead.id}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-600 mt-0.5">
                        {lead.vehicle.brand} {lead.vehicle.model} ({lead.vehicle.year}) • {lead.vehicle.kmRidden.toLocaleString()} km
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>📍 {lead.customer.city}</span>
                        <span>👤 {lead.assignedEmployee?.name || 'Unassigned'}</span>
                        <span>🕒 {formatRelativeTime(lead.lastCustomerMessageAt || lead.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {lead.currentStage.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs font-bold text-slate-900">
                        {lead.quote?.currentOfferedPrice ? formatINR(lead.quote.currentOfferedPrice) : 'Pending Valuation'}
                      </div>
                    </div>

                    <Link
                      href={`/leads/${lead.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-orange-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Workspace</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Employee Workload & Quick AI Stream (1 col) */}
        <div className="space-y-4">
          {/* Employee Workload OS Card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Employee Workload Engine</h3>
                <p className="text-[11px] text-slate-500">Real-time assignment balancing</p>
              </div>
              <Link href="/employees" className="text-[11px] font-semibold text-orange-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {INITIAL_EMPLOYEES.slice(0, 4).map((emp) => {
                const loadPercent = Math.round((emp.activeLeadsCount / emp.maxLeadCapacity) * 100);
                return (
                  <div key={emp.id} className="text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{emp.name}</span>
                      <span className="text-[11px] text-slate-500">
                        {emp.activeLeadsCount} / {emp.maxLeadCapacity} leads ({loadPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          loadPercent > 80 ? 'bg-red-500' : loadPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parked Leads Reactivation Spotlight */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50/50 p-4 rounded-xl border border-purple-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-purple-700" />
              <h3 className="text-xs font-bold text-purple-950">Parked Leads Lifecycle</h3>
            </div>
            <p className="text-xs text-purple-900 leading-snug">
              <strong>“Park is not Lost”</strong>: 41 leads currently in automated nurture loops. Next scheduled batch: 12 leads for revised festival valuation quotes.
            </p>
            <div className="mt-3">
              <Link
                href="/marketing"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900"
              >
                <span>Trigger WhatsApp Reactivation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

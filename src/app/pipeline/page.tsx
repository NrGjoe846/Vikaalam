'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GitPullRequest,
  Filter,
  Flame,
  Search,
  Bike,
  User,
  Clock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { INITIAL_LEADS } from '@/lib/store/crm-store';
import { formatINR, formatRelativeTime } from '@/lib/utils';
import { PipelineStage, Lead } from '@/types/crm';
import { AcquisitionStateMachine } from '@/lib/engine/state-machine';

const STAGE_COLUMNS: { id: PipelineStage; title: string; category: string }[] = [
  { id: '01_NEW_LEAD', title: '01 New Lead', category: 'Intake' },
  { id: '02_QUALIFICATION', title: '02 Qualification', category: 'Intake' },
  { id: '03_DETAILS_COLLECTION', title: '03 Specs Collection', category: 'Intake' },
  { id: '04_DOCUMENT_COLLECTION', title: '04 Document Collection', category: 'Verification' },
  { id: '05_PHOTO_COLLECTION', title: '05 Photo Verification', category: 'Verification' },
  { id: '06_AI_VALUATION', title: '06 AI Valuation', category: 'Pricing' },
  { id: '07_QUOTE_PENDING', title: '07 Quote Pending', category: 'Pricing' },
  { id: '08_QUOTE_SENT', title: '08 Quote Sent', category: 'Sales' },
  { id: '09_NEGOTIATION', title: '09 Negotiation', category: 'Sales' },
  { id: '10_INSPECTION_PENDING', title: '10 Inspection Pending', category: 'Inspection' },
  { id: '11_INSPECTION_SCHEDULED', title: '11 Scheduled', category: 'Inspection' },
  { id: '12_INSPECTION_COMPLETED', title: '12 Inspected', category: 'Inspection' },
  { id: '13_PURCHASE_APPROVAL', title: '13 Purchase Approval', category: 'Purchase' },
  { id: '14_PURCHASED', title: '14 Purchased', category: 'Purchase' },
  { id: '15_INVENTORY', title: '15 Inventory / Resale', category: 'Inventory' },
];

export default function MasterPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PARKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeads = leads.filter((lead) => {
    if (activeTab === 'ACTIVE' && lead.currentStage === 'PARKED') return false;
    if (activeTab === 'PARKED' && lead.currentStage !== 'PARKED') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        lead.customer.name.toLowerCase().includes(q) ||
        lead.vehicle.brand.toLowerCase().includes(q) ||
        lead.vehicle.model.toLowerCase().includes(q) ||
        lead.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const parkedLeads = leads.filter((l) => l.currentStage === 'PARKED');

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-10">
      {/* Header & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Master Acquisition Pipeline</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              15 Granular Stages
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict State Machine governing lead qualification, valuation guardrails, inspection queue, and inventory intake.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active / Parked Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Pipelines ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'ACTIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Queues ({leads.filter((l) => l.currentStage !== 'PARKED').length})
            </button>
            <button
              onClick={() => setActiveTab('PARKED')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'PARKED' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:text-purple-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Parked Queue ({parkedLeads.length})</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by customer, bike, lead ID..."
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scrollable) */}
      <div className="flex gap-3 overflow-x-auto pb-6 pt-1 select-none">
        {STAGE_COLUMNS.map((col) => {
          const colLeads = filteredLeads.filter((l) => l.currentStage === col.id);

          return (
            <div
              key={col.id}
              className="w-72 shrink-0 bg-slate-100/90 rounded-xl border border-slate-200/80 flex flex-col max-h-[780px]"
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/80 flex items-center justify-between bg-white/70 rounded-t-xl">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{col.category}</div>
                  <div className="text-xs font-bold text-slate-800 truncate">{col.title}</div>
                </div>
                <span className="text-[11px] font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full">
                  {colLeads.length}
                </span>
              </div>

              {/* Lead Cards List */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                {colLeads.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400">No leads in this stage</div>
                ) : (
                  colLeads.map((lead) => {
                    const isHot = lead.leadTemperature === 'HOT';
                    return (
                      <div
                        key={lead.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs hover:border-orange-400 transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/leads/${lead.id}`}
                              className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors"
                            >
                              {lead.customer.name}
                            </Link>
                            <div className="text-[10px] text-slate-400 font-mono">#{lead.id}</div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isHot ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {lead.leadTemperature}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium">
                          {lead.vehicle.brand} {lead.vehicle.model} ({lead.vehicle.year})
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-900">
                            {lead.quote?.currentOfferedPrice ? formatINR(lead.quote.currentOfferedPrice) : '₹---'}
                          </span>
                          <span className="text-[10px] text-slate-400">📍 {lead.customer.city}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            👤 {lead.assignedEmployee?.name?.split(' ')[0] || 'Unassigned'}
                          </span>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

        {/* Dedicated PARK Queue Column (Section 3: Park is not Lost) */}
        <div className="w-72 shrink-0 bg-purple-50/80 rounded-xl border border-purple-200 flex flex-col max-h-[780px]">
          <div className="p-3 border-b border-purple-200/80 flex items-center justify-between bg-purple-100/60 rounded-t-xl">
            <div>
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Reactivation Engine</div>
              <div className="text-xs font-bold text-purple-950">PARKED QUEUE</div>
            </div>
            <span className="text-[11px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">
              {parkedLeads.length}
            </span>
          </div>

          <div className="flex-1 p-2 space-y-2 overflow-y-auto">
            {parkedLeads.length === 0 ? (
              <div className="py-8 text-center text-[11px] text-purple-400">No parked leads</div>
            ) : (
              parkedLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="bg-white p-3 rounded-lg border border-purple-200 shadow-xs hover:border-purple-400 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Link href={`/leads/${lead.id}`} className="text-xs font-bold text-slate-900 hover:text-purple-700">
                        {lead.customer.name}
                      </Link>
                      <div className="text-[10px] text-slate-400">#{lead.id}</div>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                      {lead.parkReason?.replace(/_/g, ' ') || 'PARKED'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-medium">
                    {lead.vehicle.brand} {lead.vehicle.model} ({lead.vehicle.year})
                  </div>

                  <div className="text-[10px] text-purple-900 bg-purple-50 p-1.5 rounded border border-purple-100">
                    Reactivate in: <strong>3 days</strong> (Batch #04)
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-[10px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-0.5"
                    >
                      <span>Unpark Lead</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

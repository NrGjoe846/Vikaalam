'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Sparkles,
  Bike,
  User,
} from 'lucide-react';
import { INITIAL_LEADS } from '@/lib/store/crm-store';
import { formatINR, formatRelativeTime } from '@/lib/utils';
import { Lead } from '@/types/crm';

interface ApprovalItem {
  id: string;
  leadId: string;
  lead: Lead;
  type: 'PRICE_OVERRIDE' | 'PURCHASE_ORDER' | 'DEFECT_WAIVER';
  requestedBy: string;
  originalPrice: number;
  proposedPrice: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requiredRole: string;
  createdAt: string;
}

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: 'appr_01',
    leadId: 'L10291',
    lead: INITIAL_LEADS[0],
    type: 'PRICE_OVERRIDE',
    requestedBy: 'Priya Sundaram (Sales Exec)',
    originalPrice: 70000,
    proposedPrice: 72000,
    reason: 'Customer countered at ₹75,000 for 2022 Activa with complete showroom history. Offering ₹72,000 to close inspection today.',
    status: 'PENDING',
    requiredRole: 'Sales Manager',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'appr_02',
    leadId: 'L10296',
    lead: INITIAL_LEADS[5],
    type: 'PURCHASE_ORDER',
    requestedBy: 'Ramesh Kumar (Inspector)',
    originalPrice: 84000,
    proposedPrice: 81500,
    reason: '13-Point inspection completed for 2021 Pulsar NS200. ₹2,500 minor defect deduction accepted by seller. Requesting spot purchase payout.',
    status: 'PENDING',
    requiredRole: 'Finance Director',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
];

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);

  const handleAction = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setApprovals((prev) =>
      prev.map((appr) => (appr.id === id ? { ...appr, status: newStatus } : appr))
    );
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Pricing & Purchase Authority Approvals</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
              {pendingCount} Pending Decisions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict Guardrail Matrix preventing unauthorized price changes and ensuring multi-tier manager sign-offs.
          </p>
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-3">
        {approvals.map((appr) => {
          const isPending = appr.status === 'PENDING';
          const isApproved = appr.status === 'APPROVED';
          const isRejected = appr.status === 'REJECTED';

          return (
            <div
              key={appr.id}
              className={`p-5 rounded-xl border transition-all bg-white shadow-xs ${
                isPending
                  ? 'border-orange-200/80 bg-gradient-to-r from-orange-50/20 to-transparent'
                  : isApproved
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{appr.lead.customer.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">#{appr.leadId}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {appr.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium mt-0.5">
                      {appr.lead.vehicle.brand} {appr.lead.vehicle.model} ({appr.lead.vehicle.year}) • {appr.lead.vehicle.kmRidden.toLocaleString()} KM
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Proposed Value</div>
                    <div className="text-base font-bold text-slate-900">{formatINR(appr.proposedPrice)}</div>
                    <div className="text-[10px] text-slate-400">Baseline: {formatINR(appr.originalPrice)}</div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      isPending
                        ? 'bg-amber-100 text-amber-800'
                        : isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {appr.status}
                  </span>
                </div>
              </div>

              {/* Rationale and Details */}
              <div className="py-3 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Requested By: <strong>{appr.requestedBy}</strong></span>
                  <span>Required Sign-off: <strong>{appr.requiredRole}</strong></span>
                  <span>🕒 {formatRelativeTime(appr.createdAt)}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg text-slate-800 border border-slate-200/80 leading-relaxed text-xs">
                  {appr.reason}
                </div>
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => handleAction(appr.id, 'REJECTED')}
                    className="px-4 py-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Reject Override
                  </button>
                  <button
                    onClick={() => handleAction(appr.id, 'APPROVED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize & Update Quote</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

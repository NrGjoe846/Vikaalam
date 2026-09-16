'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bike,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { INITIAL_LEADS } from '@/lib/store/crm-store';
import { formatINR } from '@/lib/utils';
import { InspectionChecklistItem } from '@/types/crm';

interface InspectionItemState {
  id: string;
  category: string;
  label: string;
  status: 'PASS' | 'MINOR_DEFECT' | 'MAJOR_DEFECT' | 'REPLACE';
  cost: number;
  notes: string;
}

const DEFAULT_CHECKLIST: InspectionItemState[] = [
  { id: '1', category: 'ENGINE', label: 'Engine Compression & Head Acoustics', status: 'PASS', cost: 0, notes: 'Clean engine sound' },
  { id: '2', category: 'TRANSMISSION', label: 'Clutch Engagement & Smooth Gearshift', status: 'PASS', cost: 0, notes: 'Smooth shifting' },
  { id: '3', category: 'BRAKES', label: 'Front & Rear Brake Pads & Disc Rotor', status: 'MINOR_DEFECT', cost: 1000, notes: 'Front brake pad 30% life' },
  { id: '4', category: 'TYRES', label: 'Front & Rear Tyre Tread Depth', status: 'MINOR_DEFECT', cost: 1500, notes: 'Rear tyre needs change in 3k km' },
  { id: '5', category: 'BATTERY', label: 'Battery Voltage & Self-Starter Draw', status: 'PASS', cost: 0, notes: '12.8V healthy battery' },
  { id: '6', category: 'SUSPENSION', label: 'Front Telescopic Forks & Rear Monoshock', status: 'PASS', cost: 0, notes: 'Zero oil leakage' },
  { id: '7', category: 'ELECTRICAL', label: 'Wiring Harness, Indicators & LED Lights', status: 'PASS', cost: 0, notes: 'All switches functional' },
  { id: '8', category: 'CHASSIS_FRAME', label: 'Chassis Alignment, Rust & Welds', status: 'PASS', cost: 0, notes: 'Original factory frame' },
  { id: '9', category: 'ODOMETER_TAMPERING', label: 'ECU Digital vs Cluster Sync', status: 'PASS', cost: 0, notes: 'Verified 28,000 km exact' },
  { id: '10', category: 'ACCIDENT_CHECK', label: 'Fork Bend & Handlebar Centering', status: 'PASS', cost: 0, notes: 'No crash indicators' },
  { id: '11', category: 'DOCUMENTS', label: 'Physical Chassis No. & Engine No. Match', status: 'PASS', cost: 0, notes: '100% matched with RC' },
  { id: '12', category: 'ROAD_TEST', label: 'Road Test (40-70 km/h Straight Tracking)', status: 'PASS', cost: 0, notes: 'Stable alignment' },
];

export default function InspectorAppPage() {
  const [checklist, setChecklist] = useState<InspectionItemState[]>(DEFAULT_CHECKLIST);
  const [selectedLead, setSelectedLead] = useState(INITIAL_LEADS[0]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const initialOffer = selectedLead.quote?.currentOfferedPrice || 70000;
  const totalDeductions = checklist.reduce((sum, item) => sum + item.cost, 0);
  const finalBuyPrice = Math.max(10000, initialOffer - totalDeductions);
  const expectedResale = (selectedLead.valuation?.expectedResalePrice || 82000);
  const revisedGrossMargin = expectedResale - finalBuyPrice;

  const handleStatusChange = (id: string, newStatus: 'PASS' | 'MINOR_DEFECT' | 'MAJOR_DEFECT' | 'REPLACE') => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let cost = 0;
        if (newStatus === 'MINOR_DEFECT') cost = 1200;
        else if (newStatus === 'MAJOR_DEFECT') cost = 3000;
        else if (newStatus === 'REPLACE') cost = 6000;
        return { ...item, status: newStatus, cost };
      })
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* PWA Mobile Header */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              FIELD INSPECTOR PWA
            </span>
            <span className="text-xs text-slate-400">Inspector Ramesh Kumar (Chennai Hub)</span>
          </div>
          <h1 className="text-xl font-bold mt-1">13-Point Digital Vehicle Inspection Wizard</h1>
          <p className="text-xs text-slate-300">
            Real-time mechanical verification, defect scoring, and purchase recommendation engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/leads/${selectedLead.id}`}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-200"
          >
            Back to Workspace
          </Link>
        </div>
      </div>

      {/* Current Appointment Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{selectedLead.customer.name} • {selectedLead.customer.phone}</div>
            <div className="text-xs text-slate-600 font-medium">
              {selectedLead.vehicle.brand} {selectedLead.vehicle.model} ({selectedLead.vehicle.year}) • {selectedLead.vehicle.kmRidden.toLocaleString()} KM
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>📍 {selectedLead.customer.city} (Anna Nagar Hub)</span>
              <span>🕒 Appointment: Today 11:30 AM</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Initial Quote</div>
          <div className="text-base font-bold text-slate-900">{formatINR(initialOffer)}</div>
        </div>
      </div>

      {/* Step-by-Step 13-Point Checklist Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mechanical & Cosmetic Evaluation</h3>
            <p className="text-[11px] text-slate-500">Tap severity button to update condition and calculate automatic repair deduction</p>
          </div>
          <span className="text-xs font-bold text-slate-700">
            {checklist.filter((i) => i.status === 'PASS').length} / {checklist.length} Passed
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {checklist.map((item) => (
            <div key={item.id} className="p-3.5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 font-mono">#{item.id}</span>
                  <span className="text-xs font-bold text-slate-900">{item.label}</span>
                </div>
                <div className="text-[11px] text-slate-500">{item.notes}</div>
              </div>

              {/* Status Selector Pills */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleStatusChange(item.id, 'PASS')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    item.status === 'PASS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ✓ Pass
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'MINOR_DEFECT')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    item.status === 'MINOR_DEFECT'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Minor (₹1.2K)
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'MAJOR_DEFECT')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    item.status === 'MAJOR_DEFECT'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Major (₹3K)
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'REPLACE')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    item.status === 'REPLACE'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Replace (₹6K)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final Purchase Recommendation Engine Result */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold">Purchase Decision Engine</h3>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
            BUY RECOMMENDATION: 88% Confidence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Initial Offer</div>
            <div className="text-lg font-bold text-slate-300 mt-0.5">{formatINR(initialOffer)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Deductions: -{formatINR(totalDeductions)}</div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-orange-500/40 bg-orange-950/20">
            <div className="text-[10px] text-orange-400 font-semibold uppercase">Final Spot Buy Price</div>
            <div className="text-2xl font-black text-orange-400 mt-0.5">{formatINR(finalBuyPrice)}</div>
            <div className="text-[10px] text-slate-300 mt-1">Ready for Instant Bank Transfer</div>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <div className="text-[10px] text-emerald-400 font-semibold uppercase">Expected Gross Margin</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">+{formatINR(revisedGrossMargin)}</div>
            <div className="text-[10px] text-slate-400 mt-1">Resale Benchmark: {formatINR(expectedResale)}</div>
          </div>
        </div>

        {/* Action Decision Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            {isSubmitted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Inspection submitted & synced to CRM Stage 13 (Purchase Approval)!
              </span>
            ) : (
              <span>Physical checklist verified by Inspector Ramesh Kumar</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubmitted(true)}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit Inspection & Request Purchase Order</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Bell,
  Search,
  MapPin,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export function Header() {
  const [selectedBranch, setSelectedBranch] = useState('All Branches');

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search & Branch Filter */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, customer phone, bike model (e.g. TN 09 BX 4412, Activa, Classic 350)..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shrink-0">
          <MapPin className="w-3.5 h-3.5 text-orange-600" />
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-slate-700"
          >
            <option>All Branches (Tamil Nadu & Karnataka)</option>
            <option>Chennai - Anna Nagar</option>
            <option>Chennai - Velachery</option>
            <option>Bangalore - Indiranagar</option>
            <option>Coimbatore Central</option>
          </select>
        </div>
      </div>

      {/* Live SLA & Activity Indicators */}
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] text-amber-800 font-medium">
          <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
          <span>3 Hot Leads Pending SLA</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] text-emerald-800 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI Autonomy: 84.2%</span>
        </div>

        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}

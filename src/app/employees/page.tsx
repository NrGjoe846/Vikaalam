'use client';

import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Briefcase,
  Star,
  MapPin,
  TrendingUp,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { INITIAL_EMPLOYEES, INITIAL_LEADS } from '@/lib/store/crm-store';
import { WorkloadAssignmentEngine } from '@/lib/engine/assignment';
import { Employee } from '@/types/crm';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  const filteredEmployees = employees.filter((emp) =>
    selectedBranch === 'ALL' ? true : emp.location.toLowerCase().includes(selectedBranch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              EMPLOYEE OPERATING SYSTEM
            </span>
            <span className="text-xs text-slate-400">Team Hierarchy & Workload Engine</span>
          </div>
          <h1 className="text-2xl font-bold mt-1">Employee Operations & Dynamic Lead Balancing</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Multi-branch organizational structure with automated multi-factor assignment (Location + Language + Skills + Capacity - Workload).
          </p>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700 text-xs shrink-0">
          <button
            onClick={() => setSelectedBranch('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedBranch === 'ALL' ? 'bg-orange-600 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            All Hubs ({employees.length})
          </button>
          <button
            onClick={() => setSelectedBranch('Chennai')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedBranch === 'Chennai' ? 'bg-orange-600 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Chennai
          </button>
          <button
            onClick={() => setSelectedBranch('Bangalore')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              selectedBranch === 'Bangalore' ? 'bg-orange-600 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Bangalore
          </button>
        </div>
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const loadPercent = Math.round((emp.activeLeadsCount / emp.maxLeadCapacity) * 100);
          const isAvailable = emp.status === 'ONLINE';

          return (
            <div
              key={emp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-orange-300 transition-all space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                    {emp.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{emp.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{emp.role.replace(/_/g, ' ')}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-orange-600" />
                      <span>{emp.branch}</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {emp.status}
                </span>
              </div>

              {/* Skills & Languages */}
              <div className="space-y-1.5 text-xs">
                <div className="flex flex-wrap gap-1">
                  {emp.languages.map((lang) => (
                    <span key={lang} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      🗣 {lang}
                    </span>
                  ))}
                  {emp.skills.map((skill) => (
                    <span key={skill} className="text-[10px] font-semibold bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-200/60">
                      ⚡ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Workload Capacity Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600">Active Load</span>
                  <span className="font-bold text-slate-900">
                    {emp.activeLeadsCount} / {emp.maxLeadCapacity} leads ({loadPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      loadPercent > 80 ? 'bg-red-500' : loadPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400">Rating</div>
                  <div className="font-bold text-slate-900 mt-0.5 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{emp.performanceRating} / 5.0</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400">Conversion</div>
                  <div className="font-bold text-emerald-600 mt-0.5">{emp.conversionRate}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

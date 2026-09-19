'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitPullRequest,
  Smartphone,
  CheckSquare,
  ShieldCheck,
  Megaphone,
  BarChart3,
  Users,
  Sparkles,
  Layers,
  Plug,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Master Pipeline', icon: GitPullRequest, badge: '15 Stages' },
  { href: '/leads/L10291', label: 'Lead Workspace', icon: Sparkles, badge: 'Active AI' },
  { href: '/inspector', label: 'Inspector App', icon: Smartphone, badge: 'PWA' },
  { href: '/approvals', label: 'Pricing Approvals', icon: ShieldCheck, badge: '2 Pending' },
  { href: '/marketing', label: 'Marketing & Reactivation', icon: Megaphone },
  { href: '/analytics', label: 'Management AI & KPIs', icon: BarChart3 },
  { href: '/employees', label: 'Employee OS', icon: Users },
  { href: '/settings/integrations', label: 'Integrations & API', icon: Plug, badge: 'UNAI FLOW' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 w-full">
          <div className="h-9 w-auto flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/logo.webp"
              alt="VIKALAAM"
              className="h-7 w-auto object-contain brightness-110 drop-shadow-md"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
              <span>VIKALAAM</span>
              <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                AI OS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate">Used-Bike Acquisition CRM</div>
          </div>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Core Operations</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-orange-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Swarm Status Card */}
      <div className="p-3 m-3 bg-slate-800/80 rounded-xl border border-slate-700/50">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Agentic Swarm
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
            Active
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          7 specialized sub-agents running: Intake, Qualification, Valuation, Sales, Inspection, Reactivation.
        </p>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center gap-3 bg-slate-950/40">
        <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
          KS
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-white truncate">Karthi Selvan</div>
          <div className="text-[10px] text-slate-400 truncate">Sales Manager (Chennai)</div>
        </div>
      </div>
    </aside>
  );
}

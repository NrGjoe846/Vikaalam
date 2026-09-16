'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Sparkles,
  Phone,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Bike,
  FileText,
  Camera,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  MapPin,
  Flame,
  ChevronRight,
  ThumbsUp,
  MessageCircle,
  XCircle,
} from 'lucide-react';
import { INITIAL_LEADS, INITIAL_MESSAGES, INITIAL_EMPLOYEES } from '@/lib/store/crm-store';
import { formatINR, formatCompactINR, formatRelativeTime } from '@/lib/utils';
import { Lead, Message, AIAuditLog, ParkReason, EmployeeRole } from '@/types/crm';
import { AgentOrchestrator } from '@/lib/engine/agents/orchestrator';
import { AcquisitionStateMachine } from '@/lib/engine/state-machine';
import { ValuationEngine } from '@/lib/engine/valuation';

export default function LeadWorkspacePage({ params }: { params?: { id?: string } }) {
  // Find lead by id or default to first
  const leadId = params?.id || 'L10291';
  const initialLead = INITIAL_LEADS.find((l) => l.id === leadId) || INITIAL_LEADS[0];

  const [lead, setLead] = useState<Lead>(initialLead);
  const [messages, setMessages] = useState<Message[]>(
    INITIAL_MESSAGES[lead.id] || [
      {
        id: 'msg_default',
        conversationId: lead.id,
        sender: 'CUSTOMER',
        content: `Hello, I want to sell my ${lead.vehicle.brand} ${lead.vehicle.model}.`,
        timestamp: lead.createdAt,
        status: 'READ',
      },
    ]
  );
  const [inputText, setInputText] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AIAuditLog[]>([
    {
      id: 'audit_01',
      leadId: lead.id,
      agentName: 'Intake Agent',
      action: 'LEAD_CREATED_FROM_WHATSAPP',
      inputContext: 'Inbound chat from +91 98402 11223',
      decision: 'Extracted vehicle details and matched customer profile.',
      result: 'LEAD_INITIALIZED',
      confidenceScore: 94,
      approvalRequired: false,
      timestamp: '2026-09-10T10:01:00Z',
    },
    {
      id: 'audit_02',
      leadId: lead.id,
      agentName: 'Valuation Agent',
      action: 'CALCULATE_INSTANT_QUOTE',
      inputContext: '2022 Activa 6G, 28k km, 1st Owner, Verified RC/Insurance',
      decision: 'Algorithmic valuation calculated ₹70,000 offer within ₹68k-₹71k buying bracket.',
      result: 'QUOTE_DISPATCHED',
      confidenceScore: 92,
      approvalRequired: false,
      timestamp: '2026-09-10T10:05:40Z',
    },
  ]);
  const [showParkModal, setShowParkModal] = useState(false);
  const [selectedParkReason, setSelectedParkReason] = useState<ParkReason>('PRICE_OBJECTION');

  // Send a message (simulated as customer or employee)
  const handleSendMessage = async (textToSend?: string, sender: 'CUSTOMER' | 'EMPLOYEE' = 'CUSTOMER') => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      conversationId: lead.id,
      sender,
      content: text,
      timestamp: new Date().toISOString(),
      status: 'READ',
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInputText('');

    if (sender === 'CUSTOMER') {
      setIsProcessingAI(true);
      try {
        // Run AI Orchestration Pipeline
        const result = await AgentOrchestrator.processMessage(lead, text, 'WHATSAPP');

        // Append AI response
        const aiMsg: Message = {
          id: `msg_ai_${Date.now()}`,
          conversationId: lead.id,
          sender: 'AI_AGENT',
          agentName: result.auditLog.agentName,
          content: result.responseMessage,
          quickReplies: result.quickReplies,
          suggestedActions: result.suggestedActions,
          timestamp: new Date().toISOString(),
          status: 'READ',
        };

        setMessages((prev) => [...prev, aiMsg]);
        setLead(result.updatedLead);
        setAuditLogs((prev) => [result.auditLog, ...prev]);
      } catch (err) {
        console.error('AI processing error:', err);
      } finally {
        setIsProcessingAI(false);
      }
    }
  };

  // Handle Quick Action clicks
  const handleActionClick = (action: string, payload?: any) => {
    if (action === 'SCHEDULE_INSPECTION') {
      const updated: Lead = {
        ...lead,
        currentStage: '11_INSPECTION_SCHEDULED',
        inspection: {
          id: `insp_${Date.now()}`,
          leadId: lead.id,
          vehicleId: lead.vehicle.id,
          inspectorId: 'emp_04',
          inspectorName: 'Ramesh Kumar',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          locationAddress: `${lead.customer.city} Doorstep Verification`,
          status: 'SCHEDULED',
          checklist: [],
          totalRepairDeduction: 0,
        },
      };
      setLead(updated);
      handleSendMessage('Technician Ramesh Kumar assigned for tomorrow at 11:00 AM.', 'EMPLOYEE');
    } else if (action === 'APPROVE_PRICE') {
      const approvedPrice = payload?.price || 72000;
      const updated: Lead = {
        ...lead,
        currentStage: '08_QUOTE_SENT',
        quote: lead.quote ? { ...lead.quote, currentOfferedPrice: approvedPrice, status: 'SENT' } : undefined,
      };
      setLead(updated);
      handleSendMessage(`Manager approved revised acquisition offer of ${formatINR(approvedPrice)}. Proceed with booking doorstep inspection.`, 'EMPLOYEE');
    } else if (action === 'PARK_LEAD') {
      setShowParkModal(true);
    }
  };

  const confirmParkLead = () => {
    const parkData = AcquisitionStateMachine.parkLead(lead, selectedParkReason, 7);
    const updated: Lead = {
      ...lead,
      ...parkData,
    };
    setLead(updated);
    setShowParkModal(false);
    const log: AIAuditLog = {
      id: `audit_${Date.now()}`,
      leadId: lead.id,
      agentName: 'State Machine Engine',
      action: 'LEAD_PARKED_BY_OPERATOR',
      inputContext: `Reason: ${selectedParkReason}`,
      decision: `Moved to ${updated.parkQueue} with 7-day scheduled reactivation.`,
      result: 'PARKED_SUCCESS',
      confidenceScore: 100,
      approvalRequired: false,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [log, ...prev]);
  };

  const isParked = lead.currentStage === 'PARKED';
  const valuation = lead.valuation || ValuationEngine.calculateValuation(lead.vehicle);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Top Breadcrumb & Status Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/pipeline"
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">{lead.customer.name}</h1>
              <span className="text-xs font-mono text-slate-400">#{lead.id}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  lead.leadTemperature === 'HOT'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {lead.leadTemperature} ({lead.leadScore} pts)
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isParked
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {lead.currentStage.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-4">
              <span>🛵 {lead.vehicle.brand} {lead.vehicle.model} ({lead.vehicle.year})</span>
              <span>📍 {lead.customer.city}</span>
              <span>👤 Assigned: <strong>{lead.assignedEmployee?.name || 'Unassigned'}</strong></span>
              <span>💬 Channel: <strong>WhatsApp Direct</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isParked ? (
            <button
              onClick={() => {
                const unparkData = AcquisitionStateMachine.unparkLead(lead, '09_NEGOTIATION');
                setLead({ ...lead, ...unparkData });
              }}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Unpark & Reactivate Lead</span>
            </button>
          ) : (
            <button
              onClick={() => setShowParkModal(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            >
              Park Lead
            </button>
          )}

          <Link
            href="/inspector"
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-orange-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Open Inspector App</span>
          </Link>
        </div>
      </div>

      {/* 3-Column Command Center Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* COLUMN 1: Customer & Vehicle 360 (3 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Profile 360 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-orange-600" /> Customer 360
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{lead.customer.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Phone & WhatsApp</div>
                <div className="font-semibold text-slate-800">{lead.customer.phone}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Location</div>
                <div className="font-semibold text-slate-800">{lead.customer.city}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Language</div>
                <div className="font-semibold text-slate-800">{lead.customer.preferredLanguage}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Customer History</div>
                <div className="font-semibold text-emerald-600">New Seller (1 Lead)</div>
              </div>
            </div>
          </div>

          {/* Vehicle Profile 360 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-orange-600" /> Vehicle 360
              </span>
              <span className="text-xs font-bold text-slate-900">{lead.vehicle.registrationNumber || 'Pending Reg'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Make & Model</div>
                <div className="font-bold text-slate-800">{lead.vehicle.brand} {lead.vehicle.model}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Reg Year & KM</div>
                <div className="font-semibold text-slate-800">{lead.vehicle.year} • {lead.vehicle.kmRidden.toLocaleString()} km</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Ownership</div>
                <div className="font-semibold text-slate-800">{lead.vehicle.ownerCount === 1 ? '1st Single Owner' : `${lead.vehicle.ownerCount} Owners`}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Service History</div>
                <div className="font-semibold text-slate-800">{lead.vehicle.serviceHistory.replace(/_/g, ' ')}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Customer Asking</div>
                <div className="font-bold text-slate-900 text-sm">{formatINR(lead.vehicle.customerExpectedPrice)}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Hypothecation</div>
                <div className="font-semibold text-slate-800">{lead.vehicle.loanStatus.replace(/_/g, ' ')}</div>
              </div>
            </div>

            {/* Dynamic Document Checklist */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                <span>Document Verification</span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {lead.vehicle.documents.filter((d) => d.status === 'VERIFIED').length} / {lead.vehicle.documents.length} Verified
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {lead.vehicle.documents.map((doc) => (
                  <div
                    key={doc.name}
                    className="p-1.5 rounded bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[10px]"
                  >
                    <span className="font-semibold text-slate-700">{doc.name}</span>
                    <span
                      className={`font-bold ${
                        doc.status === 'VERIFIED'
                          ? 'text-emerald-600'
                          : doc.status === 'PENDING_VERIFICATION'
                          ? 'text-amber-600'
                          : 'text-red-500'
                      }`}
                    >
                      {doc.status === 'VERIFIED' ? '✓ OK' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Algorithmic Valuation & Guardrails Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl text-white shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Guardrailed Valuation
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                {valuation.confidenceScore}% Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-400">Fair Market Baseline</div>
                <div className="text-base font-bold text-white mt-0.5">{formatINR(valuation.baselineMarketValue)}</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-400">Autonomous Buy Target</div>
                <div className="text-base font-bold text-orange-400 mt-0.5">{formatINR(valuation.recommendedBuyMax)}</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-400">Max Approved Ceiling</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">{formatINR(valuation.maxApprovedPrice)}</div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <div className="text-[10px] text-slate-400">Projected Resale Margin</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">+{formatINR(valuation.expectedGrossMargin)}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
              <div className="font-semibold text-slate-200">Valuation Factors:</div>
              {valuation.reasoning.map((r, i) => (
                <div key={i} className="text-slate-400 text-[10px] flex items-start gap-1">
                  <span>•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 2: Live Omnichannel WhatsApp Chat Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[760px]">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50 rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>WhatsApp Live Gateway</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[10px] text-slate-500">{lead.customer.phone} • {lead.customer.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                AI Autonomous Mode
              </span>
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#efeae2]/30">
            {messages.map((msg) => {
              const isCustomer = msg.sender === 'CUSTOMER';
              const isAI = msg.sender === 'AI_AGENT';
              const isEmployee = msg.sender === 'EMPLOYEE';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'} max-w-[88%] ${
                    isCustomer ? 'mr-auto' : 'ml-auto'
                  }`}
                >
                  <div className="text-[10px] font-semibold text-slate-500 mb-0.5 px-1 flex items-center gap-1">
                    {isCustomer ? (
                      <span>{lead.customer.name}</span>
                    ) : isAI ? (
                      <span className="text-orange-600 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {msg.agentName || 'VIKALAAM AI'}
                      </span>
                    ) : (
                      <span className="text-blue-600 font-bold">👤 {lead.assignedEmployee?.name || 'Sales Officer'}</span>
                    )}
                    <span className="text-[9px] text-slate-400">{formatRelativeTime(msg.timestamp)}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs shadow-2xs whitespace-pre-wrap leading-relaxed ${
                      isCustomer
                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-200/80'
                        : isAI
                        ? 'bg-orange-50 text-slate-900 border border-orange-200/90 rounded-tr-none'
                        : 'bg-blue-600 text-white rounded-tr-none'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Interactive Quick Action / Reply Buttons in Chat Stream */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.quickReplies.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => handleSendMessage(reply, 'CUSTOMER')}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all shadow-xs ${
                            reply.includes('INTERESTED') && !reply.includes('NOT')
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                              : reply.includes('WANT TO DISCUSS')
                              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                              : reply.includes('NOT INTERESTED')
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                              : 'bg-white hover:bg-orange-50 text-orange-700 border-orange-300 hover:border-orange-500'
                          }`}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isProcessingAI && (
              <div className="flex items-center gap-2 text-xs text-orange-600 font-semibold p-2 bg-orange-50 rounded-lg w-fit">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Agent Orchestrator analyzing intent & business rules...</span>
              </div>
            )}
          </div>

          {/* Quick Simulation Templates */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px]">
            <span className="text-slate-400 shrink-0 font-medium">Customer Sim:</span>
            <button
              onClick={() => handleSendMessage('Can you do ₹72,000 and finalize today?', 'CUSTOMER')}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-orange-400 hover:text-orange-600 shrink-0"
            >
              "Can you do ₹72,000?"
            </button>
            <button
              onClick={() => handleSendMessage('[ INTERESTED ] Book inspection for tomorrow 11 AM', 'CUSTOMER')}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-emerald-400 hover:text-emerald-700 shrink-0"
            >
              "Book inspection tomorrow"
            </button>
            <button
              onClick={() => handleSendMessage('Please transfer me to your sales manager', 'CUSTOMER')}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-red-400 hover:text-red-600 shrink-0"
            >
              "Talk to manager"
            </button>
          </div>

          {/* Message Input Box */}
          <div className="p-3 border-t border-slate-200 bg-white rounded-b-xl flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Simulate customer message or send manual employee reply..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* COLUMN 3: AI Employee Copilot & Audit Trail (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Live Copilot Recommendation */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-600" /> AI Employee Copilot
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {lead.conversionProbability}% Conv. Probability
              </span>
            </div>

            {/* Next Best Action Card */}
            <div className="p-3 rounded-lg bg-orange-50/70 border border-orange-200 space-y-2">
              <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wide">Next Best Action</div>
              <p className="text-xs font-semibold text-slate-900 leading-snug">
                Customer counter-offered ₹75,000. Recommend matching at ₹72,000 (Level 2 Authority) and closing inspection slot.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleActionClick('APPROVE_PRICE', { price: 72000 })}
                  className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold rounded shadow-xs"
                >
                  Authorize ₹72K Offer
                </button>
                <button
                  onClick={() => handleActionClick('SCHEDULE_INSPECTION')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold rounded"
                >
                  Book Inspection
                </button>
              </div>
            </div>

            {/* Quick Copilot Action Shortcuts */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee Overrides</div>
              <button
                onClick={() => handleSendMessage('Hello Anand, this is Karthi Selvan (Sales Manager). I reviewed your Activa and would like to invite you for inspection.', 'EMPLOYEE')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-between"
              >
                <span>Take Over / Manual Reply</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => handleActionClick('SCHEDULE_INSPECTION')}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-between"
              >
                <span>Schedule Doorstep Inspection</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* AI Audit Trail (Section 40) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Action Audit Log
              </span>
              <span className="text-[10px] text-slate-400">{auditLogs.length} Events</span>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1 text-[11px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{log.agentName}</span>
                    <span className="text-[9px] text-slate-400">{formatRelativeTime(log.timestamp)}</span>
                  </div>
                  <div className="text-slate-600 text-[10px] font-mono leading-tight">{log.action}</div>
                  <div className="text-slate-500 text-[10px] leading-snug">{log.decision}</div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
                    <span>Confidence: {log.confidenceScore}%</span>
                    <span className={log.approvalRequired ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {log.approvalRequired ? 'Approval Required' : 'Autonomous'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Park Lead Reason Modal */}
      {showParkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Park Lead into Reactivation Queue</h3>
              <p className="text-xs text-slate-500 mt-1">
                <strong>“Park is not Lost”</strong>: Structured reason tagging allows automated targeted reactivation campaigns.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Select Park Reason:</label>
              {(
                [
                  'PRICE_OBJECTION',
                  'NOT_READY_TO_SELL',
                  'UNRESPONSIVE',
                  'INSPECTION_DELAY',
                  'DOCUMENT_PENDING',
                  'COMPETITOR_EVALUATION',
                ] as ParkReason[]
              ).map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedParkReason(reason)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedParkReason === reason
                      ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {reason.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowParkModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmParkLead}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Confirm & Park Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

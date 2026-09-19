'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plug,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Server,
  ArrowRight,
  Smartphone,
  ChevronRight,
  HelpCircle,
  Radio,
  Zap,
} from 'lucide-react';

interface IntegrationState {
  status:
    | 'NOT_CONNECTED'
    | 'CONNECTING'
    | 'CONNECTED'
    | 'INVALID_CREDENTIALS'
    | 'WHATSAPP_NOT_CONNECTED'
    | 'API_ERROR'
    | 'REVOKED'
    | 'UNKNOWN_ERROR';
  whatsapp_number?: string | null;
  application_id?: string | null;
  masked_api_key?: string | null;
  masked_client_secret?: string | null;
  base_url?: string;
  last_tested_at?: string | null;
}

export default function IntegrationsSettingsPage() {
  const [unaiFlow, setUnaiFlow] = useState<IntegrationState>({
    status: 'NOT_CONNECTED',
    base_url: 'http://localhost:8000',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    applicationId: 'vikaalam-crm-acquisition',
    clientId: 'vikaalam_client_01',
    apiKey: '',
    clientSecret: '',
    baseUrl: 'http://localhost:8000',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    message?: string;
    phone?: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);

  // Disconnect Confirmation State
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Fetch initial status on load
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/integrations/unai-flow/status');
      const data = await res.json();
      if (data.success) {
        setUnaiFlow({
          status: data.status,
          whatsapp_number: data.whatsapp_number,
          application_id: data.application_id,
          masked_api_key: data.masked_api_key,
          masked_client_secret: data.masked_client_secret,
          base_url: data.base_url || 'http://localhost:8000',
          last_tested_at: data.last_tested_at,
        });
      }
    } catch (err) {
      console.error('Error fetching integration status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.apiKey.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'Please enter a UNAI FLOW API Key (starts with wa_live_ or wa_test_).',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/integrations/unai-flow/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success && data.status === 'CONNECTED') {
        setTestResult({
          tested: true,
          success: true,
          message: 'Connection validated successfully with UNAI FLOW API!',
          phone: data.whatsapp_number,
        });
      } else {
        setTestResult({
          tested: true,
          success: false,
          message: data.error || 'Connection failed. Please verify credentials and server URL.',
        });
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Unable to connect to UNAI FLOW endpoint.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apiKey.trim()) {
      setTestResult({
        tested: true,
        success: false,
        message: 'API Key is required to connect.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/integrations/unai-flow/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setUnaiFlow({
          status: 'CONNECTED',
          whatsapp_number: data.whatsapp_number,
          application_id: formData.applicationId,
          masked_api_key: data.masked_api_key,
          masked_client_secret: data.masked_client_secret,
          base_url: formData.baseUrl,
          last_tested_at: data.last_tested_at,
        });
        setIsModalOpen(false);
        setTestResult(null);
      } else {
        setTestResult({
          tested: true,
          success: false,
          message: data.error || 'Failed to securely store credentials.',
        });
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || 'Network error connecting to CRM backend.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect UNAI FLOW? Bulk WhatsApp campaigns will be paused.')) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const res = await fetch('/api/integrations/unai-flow/disconnect', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setUnaiFlow({
          status: 'NOT_CONNECTED',
          whatsapp_number: null,
          masked_api_key: null,
          masked_client_secret: null,
          last_tested_at: null,
        });
      }
    } catch (err) {
      console.error('Error disconnecting:', err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const getStatusBadge = (status: IntegrationState['status']) => {
    switch (status) {
      case 'CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Verifying...
          </span>
        );
      case 'INVALID_CREDENTIALS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Invalid Credentials
          </span>
        );
      case 'WHATSAPP_NOT_CONNECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            WhatsApp Not Connected
          </span>
        );
      case 'API_ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            API Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Not Connected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              DEVELOPER INTEGRATIONS
            </span>
            <span className="text-xs text-slate-400">Enterprise Services & Edge API Gateway</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Integrations & API Connections</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Configure external communication channels, escrow payment gateways, and automated marketing brokers. Secrets are securely encrypted with AES-256-GCM at rest.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/marketing"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            <span>Marketing Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Security Architecture Badge */}
      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold text-white">Bank-Grade Secret Isolation:</span> Client secrets & API keys are encrypted server-side and never returned in plaintext to the frontend.
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-emerald-400 border border-slate-700">
          AES-256-GCM
        </span>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ========================================================= */}
        {/* 1. UNAI FLOW — WhatsApp Bulk Messaging */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

          <div>
            {/* Header / Status */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-inner">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>UNAI FLOW</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                      WhatsApp Gateway
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Official WhatsApp Bulk Messaging & Session Broker</p>
                </div>
              </div>

              <div>{getStatusBadge(unaiFlow.status)}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Connect your UNAI FLOW developer application to send omnichannel WhatsApp bulk campaigns, lead reactivations, price quotes, and inspection reports directly from Vikaalam CRM.
            </p>

            {/* Connection Details or Setup Callout */}
            {unaiFlow.status === 'CONNECTED' ? (
              <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    Connected WhatsApp:
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {unaiFlow.whatsapp_number || '+91 98401 12345'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    API Key:
                  </span>
                  <span className="font-mono text-slate-300">
                    {unaiFlow.masked_api_key || 'wa_live_••••••••3f9a'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    Endpoint:
                  </span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">
                    {unaiFlow.base_url || 'http://localhost:8000'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400">Last Verified:</span>
                  <span className="text-slate-300">
                    {unaiFlow.last_tested_at
                      ? new Date(unaiFlow.last_tested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Just now'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Radio className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span>Integration Required</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Requires developer application credentials from your UNAI FLOW console. Automated campaigns and lead WhatsApp broadcasts will remain paused until connected.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {unaiFlow.status === 'CONNECTED' ? (
              <>
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setFormData((prev) => ({
                      ...prev,
                      baseUrl: unaiFlow.base_url || 'http://localhost:8000',
                      applicationId: unaiFlow.application_id || 'vikaalam-crm-acquisition',
                    }));
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  View / Edit Credentials
                </button>

                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition disabled:opacity-50"
                >
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect UNAI FLOW'}
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsModalOpen(true);
                  setTestResult(null);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span>Connect UNAI FLOW</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. Zoho Payment Integration (Established Pattern Reference) */}
        {/* ========================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 shadow-inner">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Zoho Payment</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">
                      Escrow Gateway
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Vehicle Purchase Disbursement & Escrow</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Active
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Secure escrow fund release for used-bike purchases. Automatically disburses approved payout to sellers via IMPS/NEFT upon vehicle inspection sign-off.
            </p>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Merchant Account:</span>
                <span className="font-mono text-slate-300">ZOHO_MERCHANT_4821</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Escrow Entity:</span>
                <span className="font-semibold text-slate-200">Vikaalam Motors Escrow</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Webhook Payout Status:</span>
                <span className="font-mono text-emerald-400">Enabled (Instant)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Managed via Corporate Finance</span>
            <button className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
              View Audit Logs
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CONNECT MODAL / DRAWER */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Connect UNAI FLOW WhatsApp Gateway</h2>
                  <p className="text-[11px] text-slate-400">Developer API credentials are encrypted with AES-256-GCM</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAndConnect} className="space-y-4 text-xs">
              {/* API Base URL */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>UNAI FLOW API Base URL</span>
                  <span className="text-[10px] text-slate-400 font-normal">Defaults to local backend</span>
                </label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="http://localhost:8000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    API Key *
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">wa_live_... / wa_test_...</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="wa_live_3f9a7b8cD2xK1mNpQ4rS5tU6vW7xY8z9..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono text-xs pr-10 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Application ID & Client ID Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Application ID</label>
                  <input
                    type="text"
                    value={formData.applicationId}
                    onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                    placeholder="app_vikaalam_crm"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Client ID</label>
                  <input
                    type="text"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    placeholder="client_vikaalam_01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Client Secret */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Client Secret (Optional)</span>
                  <span className="text-[10px] text-slate-400">Required if OAuth2 enabled</span>
                </label>
                <div className="relative">
                  <input
                    type={showClientSecret ? 'text' : 'password'}
                    value={formData.clientSecret}
                    onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                    placeholder="cs_sec_••••••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono text-xs pr-10 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientSecret(!showClientSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Test Connection Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 animate-fade-in ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : 'bg-red-950/40 border-red-800 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-[11px] leading-snug">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.phone && (
                      <p className="mt-1 text-slate-300 font-mono">
                        Active WhatsApp Device: <strong className="text-white">{testResult.phone}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Expandable Developer Console Help */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHelpGuide(!showHelpGuide)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-semibold transition"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>How do I get UNAI FLOW credentials?</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${showHelpGuide ? 'rotate-90' : ''}`}
                  />
                </button>

                {showHelpGuide && (
                  <div className="mt-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-[11px] text-slate-300 animate-fade-in">
                    <div className="font-semibold text-white">Steps to obtain API credentials:</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                      <li>
                        Open <strong className="text-slate-200">UNAI FLOW</strong> Developer Console.
                      </li>
                      <li>
                        Verify your WhatsApp instance is paired & active under <strong className="text-slate-200">Instances</strong>.
                      </li>
                      <li>
                        Navigate to <strong className="text-slate-200">API Keys</strong> tab and click <strong className="text-slate-200">Create Key</strong>.
                      </li>
                      <li>
                        Ensure scopes include: <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">campaigns:write</code>, <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">messages:send</code>, <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">instances:read</code>.
                      </li>
                      <li>Copy the generated API Key (<code className="text-slate-200">wa_live_...</code>) and paste above.</li>
                      <li>Click <strong className="text-slate-200">Test & Connect</strong>.</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || isSaving}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing Endpoint...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || isTesting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSaving ? 'Encrypting & Saving...' : 'Save & Connect'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

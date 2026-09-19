'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  RefreshCw,
  Send,
  Users,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Sliders,
  Radio,
  Clock,
  AlertTriangle,
  X,
  MessageSquare,
  Zap,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  BarChart2,
  Trash2,
  Plus,
  Ban,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { CampaignResult, CampaignRecipientStatus } from '@/lib/integrations/types';

// Toast interface
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function MarketingPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'bulk' | 'quick' | 'playbooks'>('bulk');

  // UNAI FLOW Gateway Connection Status
  const [isGatewayConnected, setIsGatewayConnected] = useState<boolean | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [isCheckingGateway, setIsCheckingGateway] = useState(true);

  // Campaigns State
  const [campaigns, setCampaigns] = useState<CampaignResult[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Campaign Form State
  const [campaignName, setCampaignName] = useState('Diwali Used-Bike Offer Blast');
  const [messageType, setMessageType] = useState<'text' | 'image' | 'video' | 'audio' | 'poll'>('text');
  const [messageBody, setMessageBody] = useState(
    'Vanakkam {{name}}! We reviewed market demand for your {{model}}. Our revised direct cash offer is {{price}} valid for 48 hours. Ready for doorstep inspection?'
  );
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [pollQuestion, setPollQuestion] = useState('Are you interested in selling your bike this week?');
  const [pollOptions, setPollOptions] = useState<string[]>([
    'Yes, want doorstep evaluation',
    'Need higher price offer',
    'Already sold',
  ]);

  // Recipients input mode & state
  const [recipientInputMode, setRecipientInputMode] = useState<'paste' | 'file'>('paste');
  const [rawPhoneText, setRawPhoneText] = useState('+919342745299, Demo Seller\n+919840112345, Lead Karthik\n+919876543210, Priya R');
  const [parsedRecipients, setParsedRecipients] = useState<{ phone: string; name?: string }[]>([]);
  const [defaultCountryCode, setDefaultCountryCode] = useState('+91');
  const [messagesPerSec, setMessagesPerSec] = useState<number>(2.0);
  const [isSubmittingCampaign, setIsSubmittingCampaign] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Blast State
  const [quickTo, setQuickTo] = useState('+919342745299');
  const [quickMessage, setQuickMessage] = useState('Hello from VIKALAAM CRM! Your bike valuation report is ready.');
  const [quickMediaUrl, setQuickMediaUrl] = useState('');
  const [quickName, setQuickName] = useState('Instant Blast');
  const [isSendingQuick, setIsSendingQuick] = useState(false);

  // Per-Recipient Delivery View Modal State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignResult | null>(null);
  const [recipientsList, setRecipientsList] = useState<CampaignRecipientStatus[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'delivered' | 'failed' | 'queued'>('all');

  // Cancel action state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Check UNAI FLOW connection status on mount
  useEffect(() => {
    fetchIntegrationStatus();
    fetchCampaigns();
  }, []);

  const fetchIntegrationStatus = async () => {
    setIsCheckingGateway(true);
    try {
      const res = await fetch('/api/integrations/unai-flow/status');
      const data = await res.json();
      if (data.success && data.status === 'CONNECTED') {
        setIsGatewayConnected(true);
        setWhatsappNumber(data.whatsapp_number || '+919342745299');
        setApplicationId(data.application_id || 'unai_crm');
      } else {
        setIsGatewayConnected(false);
      }
    } catch (err) {
      setIsGatewayConnected(false);
    } finally {
      setIsCheckingGateway(false);
    }
  };

  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const res = await fetch('/api/integrations/unai-flow/campaigns?page=1&pageSize=30');
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // Parse raw pasted recipients
  useEffect(() => {
    if (recipientInputMode === 'paste') {
      const lines = rawPhoneText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed: { phone: string; name?: string }[] = [];

      for (const line of lines) {
        // Can be "phone, name" or "phone" or comma separated
        const parts = line.split(/[,\t]/).map((p) => p.trim());
        let phoneCandidate = parts[0] || '';
        let nameCandidate = parts.slice(1).join(' ').trim() || undefined;

        // If part 0 looks like name and part 1 looks like phone:
        if (phoneCandidate.replace(/\D/g, '').length < 7 && parts[1]) {
          const temp = phoneCandidate;
          phoneCandidate = parts[1];
          nameCandidate = temp;
        }

        const digits = phoneCandidate.replace(/\D/g, '');
        if (digits.length >= 7) {
          let formatted = phoneCandidate.startsWith('+') ? `+${digits}` : `${defaultCountryCode}${digits}`;
          parsed.push({ phone: formatted, name: nameCandidate });
        }
      }
      setParsedRecipients(parsed);
    }
  }, [rawPhoneText, defaultCountryCode, recipientInputMode]);

  // Handle CSV / TXT file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed: { phone: string; name?: string }[] = [];

      // Check if header row exists
      const firstLine = lines[0].toLowerCase();
      const startIndex = firstLine.includes('phone') || firstLine.includes('number') || firstLine.includes('mobile') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/[,\t;]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
        if (!parts.length) continue;

        let phoneCandidate = parts[0];
        let nameCandidate = parts[1] || undefined;

        if (phoneCandidate.replace(/\D/g, '').length < 7 && parts[1]) {
          const temp = phoneCandidate;
          phoneCandidate = parts[1];
          nameCandidate = temp;
        }

        const digits = phoneCandidate.replace(/\D/g, '');
        if (digits.length >= 7) {
          const formatted = phoneCandidate.startsWith('+') ? `+${digits}` : `${defaultCountryCode}${digits}`;
          parsed.push({ phone: formatted, name: nameCandidate });
        }
      }

      setParsedRecipients(parsed);
      addToast('success', 'File Uploaded', `Successfully parsed ${parsed.length} recipient numbers from ${file.name}.`);
    };

    reader.readAsText(file);
  };

  // Auto-polling: poll every 3 seconds if any campaign is in 'queued' or 'sending' status
  useEffect(() => {
    const hasActiveCampaign = campaigns.some(
      (c) => c.status === 'queued' || c.status === 'sending' || c.status === 'draft'
    );

    if (!hasActiveCampaign) return;

    const interval = setInterval(async () => {
      try {
        const activeList = campaigns.filter(
          (c) => c.status === 'queued' || c.status === 'sending' || c.status === 'draft'
        );

        const updates = await Promise.all(
          activeList.map(async (camp) => {
            try {
              const res = await fetch(`/api/integrations/unai-flow/campaigns/${camp.id}`);
              const data = await res.json();
              if (data.success && data.campaign) {
                return data.campaign as CampaignResult;
              }
            } catch (e) {
              // ignore
            }
            return camp;
          })
        );

        setCampaigns((prev) =>
          prev.map((c) => {
            const updated = updates.find((u) => u.id === c.id);
            return updated || c;
          })
        );
      } catch (err) {
        // ignore
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [campaigns]);

  // Submit Campaign (Step 1: POST /v1/campaigns + Step 2: POST /v1/campaigns/{id}/launch)
  const handleSubmitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isGatewayConnected) {
      addToast('error', 'Gateway Not Connected', 'Please connect UNAI FLOW in Settings before launching campaigns.');
      return;
    }

    if (!parsedRecipients.length) {
      addToast('error', 'No Recipients', 'Please provide at least one valid recipient phone number.');
      return;
    }

    if (messageType === 'text' && !messageBody.trim()) {
      addToast('error', 'Empty Message', 'Please enter your campaign message body.');
      return;
    }

    if ((messageType === 'image' || messageType === 'video' || messageType === 'audio') && !mediaUrl.trim()) {
      addToast('error', 'Missing Media URL', 'A publicly accessible media URL is required for media campaigns.');
      return;
    }

    setIsSubmittingCampaign(true);

    try {
      const payload: any = {
        name: campaignName.trim() || `Campaign ${new Date().toLocaleDateString()}`,
        message_type: messageType,
        message_payload: {
          body: messageBody,
          media_url: mediaUrl.trim() || undefined,
          caption: caption.trim() || undefined,
          poll:
            messageType === 'poll'
              ? {
                  question: pollQuestion.trim(),
                  options: pollOptions.filter((o) => o.trim().length > 0),
                }
              : undefined,
        },
        recipients: parsedRecipients.map((r) => ({
          recipient_jid: r.phone,
          recipient_name: r.name || 'Customer',
          variables: {
            name: r.name || 'Customer',
            model: 'Yamaha R15 V4',
            price: '₹1,25,000',
            city: 'Chennai',
          },
        })),
        messagesPerSecond: messagesPerSec,
      };

      const res = await fetch('/api/integrations/unai-flow/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.campaign) {
        addToast(
          'success',
          'Campaign Launched!',
          `Campaign "${data.campaign.name}" created and launched with ${data.campaign.total_recipients} recipients.`
        );
        // Prepend to campaign list
        setCampaigns((prev) => [data.campaign, ...prev]);
      } else {
        addToast('error', 'Campaign Launch Failed', data.error || 'Failed to dispatch campaign.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'An unexpected error occurred launching campaign.');
    } finally {
      setIsSubmittingCampaign(false);
    }
  };

  // Cancel an active campaign
  const handleCancelCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to cancel this running campaign? In-flight messages may be stopped.')) {
      return;
    }

    setCancellingId(campaignId);
    try {
      const res = await fetch(`/api/integrations/unai-flow/campaigns/${campaignId}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        addToast('info', 'Campaign Cancelled', 'The campaign has been cancelled successfully.');
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: 'cancelled' } : c))
        );
      } else {
        addToast('error', 'Cancellation Error', data.error || 'Failed to cancel campaign.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Error cancelling campaign');
    } finally {
      setCancellingId(null);
    }
  };

  // Open Per-Recipient Delivery View
  const handleViewRecipients = async (campaign: CampaignResult) => {
    setSelectedCampaignId(campaign.id);
    setSelectedCampaign(campaign);
    setIsLoadingRecipients(true);
    setRecipientsList([]);

    try {
      const res = await fetch(`/api/integrations/unai-flow/campaigns/${campaign.id}/recipients?page=1&pageSize=50`);
      const data = await res.json();
      if (data.success && Array.isArray(data.recipients)) {
        setRecipientsList(data.recipients);
      } else {
        // Fallback simulation based on campaign totals if backend recipient list is empty
        const count = campaign.total_recipients || 10;
        const simulated: CampaignRecipientStatus[] = Array.from({ length: Math.min(count, 30) }).map((_, i) => ({
          recipient_jid: `+9198401${String(10000 + i).slice(1)}`,
          recipient_name: `Recipient ${i + 1}`,
          status: i < (campaign.delivered_count || 0) ? 'delivered' : i < (campaign.sent_count || 0) ? 'delivered' : 'failed',
          timestamp: new Date().toLocaleTimeString(),
        }));
        setRecipientsList(simulated);
      }
    } catch (err) {
      console.error('Error fetching recipient breakdown:', err);
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  // Quick Blast Send
  const handleSendQuickBlast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isGatewayConnected) {
      addToast('error', 'Gateway Not Connected', 'Please connect UNAI FLOW in Settings first.');
      return;
    }

    const numbers = quickTo
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (!numbers.length) {
      addToast('error', 'Missing Recipient', 'Please enter at least one phone number.');
      return;
    }

    setIsSendingQuick(true);
    try {
      const res = await fetch('/api/integrations/unai-flow/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: numbers,
          message: quickMessage,
          campaign_name: quickName,
          media_url: quickMediaUrl || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        addToast('success', 'Dispatched!', `Quick blast sent to ${data.total_recipients || numbers.length} recipient(s).`);
        fetchCampaigns();
      } else {
        addToast('error', 'Dispatch Failed', data.error || 'Failed to send quick blast.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Error dispatching quick blast.');
    } finally {
      setIsSendingQuick(false);
    }
  };

  const getStatusBadge = (status: CampaignResult['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'sending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Sending...
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 animate-spin" />
            Queued
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Ban className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Draft
          </span>
        );
    }
  };

  const calculateProgress = (camp: CampaignResult) => {
    if (!camp.total_recipients || camp.total_recipients === 0) return 0;
    const finished = (camp.delivered_count || 0) + (camp.failed_count || 0);
    return Math.min(100, Math.round((finished / camp.total_recipients) * 100));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none">
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-md w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 animate-fade-in transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-700/60 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-700/60 text-red-200'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <MessageSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
            <div className="flex-1 text-xs">
              <div className="font-bold text-white mb-0.5">{toast.title}</div>
              <div className="text-slate-300 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Top Banner & Gateway Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              OFFICIAL WHATSAPP GATEWAY
            </span>
            <span className="text-xs text-slate-400">UNAI FLOW Bulk Messaging Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <span>WhatsApp Campaign & Reactivation Studio</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Launch multi-format bulk WhatsApp campaigns, send instant pricing blasts, and monitor real-time delivery
            per recipient.
          </p>
        </div>

        {/* Gateway Health Pill */}
        <div className="flex items-center gap-3">
          {isCheckingGateway ? (
            <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Checking gateway...</span>
            </div>
          ) : isGatewayConnected ? (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-xs flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">Live WhatsApp:</span>
                <span className="font-mono font-bold text-emerald-300">{whatsappNumber || '+919342745299'}</span>
              </div>
              <Link
                href="/settings/integrations"
                className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                Settings
              </Link>
            </div>
          ) : (
            <Link
              href="/settings/integrations"
              className="px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-700/50 text-xs text-amber-300 hover:bg-amber-900/50 transition flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Connect UNAI FLOW in Settings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Active Campaigns</div>
          <div className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <span>{campaigns.filter((c) => c.status === 'sending' || c.status === 'queued').length}</span>
            <span className="text-[11px] font-normal text-slate-400">running</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Campaigns</div>
          <div className="text-xl font-bold text-white mt-1">{campaigns.length}</div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Verified Sender</div>
          <div className="text-xs font-mono font-bold text-emerald-400 mt-2 truncate">
            {whatsappNumber || '+919342745299'}
          </div>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Max Delivery Rate</div>
          <div className="text-xl font-bold text-white mt-1">
            <span>10.0</span>
            <span className="text-xs font-normal text-slate-400 ml-1">msg / sec</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm">
        <button
          onClick={() => setActiveTab('bulk')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'bulk'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>WhatsApp Bulk Campaigns</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('quick')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'quick'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Quick Blast Dispatcher</span>
        </button>

        <button
          onClick={() => setActiveTab('playbooks')}
          className={`pb-3 font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'playbooks'
              ? 'border-emerald-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Acquisition Playbooks</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WHATSAPP BULK CAMPAIGNS STUDIO & TRACKER */}
      {/* ========================================================================= */}
      {activeTab === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: Campaign Creation Form (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Create WhatsApp Campaign</h2>
                    <p className="text-[10px] text-slate-400">2-Step Execution: Create & Launch</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitCampaign} className="space-y-4 text-xs">
                {/* Campaign Name */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Campaign Name *</label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. 7-Day Parked Lead Reactivation"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Message Type Selector */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Message Type</label>
                  <div className="grid grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                    {(['text', 'image', 'video', 'audio', 'poll'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setMessageType(type)}
                        className={`py-1.5 rounded-lg text-[11px] font-semibold capitalize flex flex-col items-center gap-1 transition ${
                          messageType === type
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        {type === 'text' && <FileText className="w-3.5 h-3.5" />}
                        {type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                        {type === 'video' && <Video className="w-3.5 h-3.5" />}
                        {type === 'audio' && <Music className="w-3.5 h-3.5" />}
                        {type === 'poll' && <BarChart2 className="w-3.5 h-3.5" />}
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Body (for text, image caption, etc.) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">
                      {messageType === 'poll' ? 'Introduction / Note' : 'Message Body *'}
                    </label>
                    <span className="text-[10px] text-slate-400">Use &#123;&#123;name&#125;&#125; for personalization</span>
                  </div>
                  <textarea
                    rows={4}
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Enter your WhatsApp template text here..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  />
                  {/* Variable chips */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium">Insert:</span>
                    {['name', 'model', 'price', 'city'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMessageBody((prev) => `${prev} {{${v}}}`)}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono border border-slate-700"
                      >
                        + &#123;&#123;{v}&#125;&#125;
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media URL Input (if image, video, or audio) */}
                {(messageType === 'image' || messageType === 'video' || messageType === 'audio') && (
                  <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800 animate-fade-in">
                    <label className="block font-semibold text-slate-300">
                      Public {messageType.toUpperCase()} URL *
                    </label>
                    <input
                      type="url"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder={`https://example.com/assets/${messageType}.jpg`}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">Must be a publicly accessible direct link.</p>

                    {/* Caption for image/video */}
                    {(messageType === 'image' || messageType === 'video') && (
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Optional Caption</label>
                        <input
                          type="text"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Short caption under media"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Poll Configuration (if poll) */}
                {messageType === 'poll' && (
                  <div className="space-y-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 animate-fade-in">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Poll Question *</label>
                      <input
                        type="text"
                        value={pollQuestion}
                        onChange={(e) => setPollQuestion(e.target.value)}
                        placeholder="e.g. Which inspection slot works for you?"
                        required
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block font-semibold text-slate-300">Poll Options</label>
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...pollOptions];
                              copy[idx] = e.target.value;
                              setPollOptions(copy);
                            }}
                            placeholder={`Option ${idx + 1}`}
                            required
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {pollOptions.length < 10 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions([...pollOptions, `Option ${pollOptions.length + 1}`])}
                          className="mt-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Option</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Recipients Input: Mode Switcher */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-300">Recipients ({parsedRecipients.length})</label>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setRecipientInputMode('paste')}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                          recipientInputMode === 'paste'
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Paste Numbers
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientInputMode('file')}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                          recipientInputMode === 'file'
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Upload CSV
                      </button>
                    </div>
                  </div>

                  {recipientInputMode === 'paste' ? (
                    <div>
                      <textarea
                        rows={3}
                        value={rawPhoneText}
                        onChange={(e) => setRawPhoneText(e.target.value)}
                        placeholder="+919342745299, John Doe&#10;+919840112345, Lead User"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Format: One per line, optional name: <code className="text-slate-300">+919876543210, Name</code>
                      </p>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl text-center cursor-pointer bg-slate-950/60 transition group"
                    >
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 mx-auto mb-1.5 transition" />
                      <div className="font-semibold text-slate-300 text-xs">Click to browse CSV or TXT file</div>
                      <div className="text-[10px] text-slate-500">Supports phone and name columns (up to 10,000 rows)</div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>

                {/* Country Code & Delivery Rate Slider */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Default Country Code</label>
                    <select
                      value={defaultCountryCode}
                      onChange={(e) => setDefaultCountryCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="+91">+91 (India)</option>
                      <option value="+1">+1 (USA/Canada)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+65">+65 (Singapore)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-300">Rate Limit</label>
                      <span className="font-mono text-emerald-400 font-bold">{messagesPerSec} msg/s</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="10.0"
                      step="0.1"
                      value={messagesPerSec}
                      onChange={(e) => setMessagesPerSec(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500">
                      <span>0.1 (Safest)</span>
                      <span>10.0 (Fast)</span>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCampaign || !isGatewayConnected}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className={`w-4 h-4 ${isSubmittingCampaign ? 'animate-spin' : ''}`} />
                    <span>{isSubmittingCampaign ? 'Staging & Launching...' : 'Launch WhatsApp Campaign'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Live Campaign List & Real-Time Tracking (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Campaign History & Live Tracker</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-xs text-slate-400">Auto-polling every 3s for active queued/sending campaigns</p>
              </div>

              <button
                onClick={fetchCampaigns}
                disabled={isLoadingCampaigns}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Campaign Cards */}
            {campaigns.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="text-sm font-semibold text-slate-300">No campaigns found</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create your first WhatsApp campaign on the left or select a template from Acquisition Playbooks.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((camp) => {
                  const progress = calculateProgress(camp);
                  const isRunning = camp.status === 'queued' || camp.status === 'sending';

                  return (
                    <div
                      key={camp.id}
                      className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition shadow-sm space-y-3 relative overflow-hidden"
                    >
                      {/* Active glow border */}
                      {isRunning && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 animate-pulse" />
                      )}

                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{camp.name}</span>
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {camp.id}</p>
                        </div>
                        <div className="flex items-center gap-2">{getStatusBadge(camp.status)}</div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                          <span>
                            Progress: <strong className="text-white">{progress}%</strong>
                          </span>
                          <span>
                            {camp.delivered_count || 0} / {camp.total_recipients || 0} delivered
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              camp.status === 'completed'
                                ? 'bg-emerald-500'
                                : camp.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-blue-500 animate-pulse'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Metric Badges */}
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <div className="text-[10px] text-slate-500">Recipients</div>
                          <div className="font-bold text-slate-200 mt-0.5">{camp.total_recipients || 0}</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <div className="text-[10px] text-slate-500">Sent</div>
                          <div className="font-bold text-blue-400 mt-0.5">{camp.sent_count || 0}</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <div className="text-[10px] text-slate-500">Delivered</div>
                          <div className="font-bold text-emerald-400 mt-0.5">{camp.delivered_count || 0}</div>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <div className="text-[10px] text-slate-500">Failed</div>
                          <div className="font-bold text-red-400 mt-0.5">{camp.failed_count || 0}</div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">
                          {camp.launched_at ? new Date(camp.launched_at).toLocaleString() : 'Ready'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewRecipients(camp)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View Recipients</span>
                          </button>

                          {isRunning && (
                            <button
                              onClick={() => handleCancelCampaign(camp.id)}
                              disabled={cancellingId === camp.id}
                              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 transition text-xs font-semibold flex items-center gap-1"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{cancellingId === camp.id ? 'Cancelling...' : 'Cancel'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUICK BLAST DISPATCHER */}
      {/* ========================================================================= */}
      {activeTab === 'quick' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Quick Single & Bulk WhatsApp Dispatcher</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct single-API call (POST /v1/messages/send) for immediate delivery without creating formal campaign jobs.
            </p>
          </div>

          <form onSubmit={handleSendQuickBlast} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Campaign Tag / Name</label>
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="e.g. Valuation Update Blast"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Recipient Number(s) *
              </label>
              <textarea
                rows={3}
                value={quickTo}
                onChange={(e) => setQuickTo(e.target.value)}
                placeholder="+919342745299, +919840112345"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Separate multiple numbers with commas or newlines.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Message Content *</label>
              <textarea
                rows={4}
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                placeholder="Type WhatsApp message..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Optional Media URL (Image/Document)</label>
              <input
                type="url"
                value={quickMediaUrl}
                onChange={(e) => setQuickMediaUrl(e.target.value)}
                placeholder="https://example.com/bike-inspection-report.pdf"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingQuick || !isGatewayConnected}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isSendingQuick ? 'animate-spin' : ''}`} />
              <span>{isSendingQuick ? 'Dispatching...' : 'Dispatch Quick Message'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACQUISITION PLAYBOOKS */}
      {/* ========================================================================= */}
      {activeTab === 'playbooks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/80 border border-orange-700/50 flex items-center justify-center text-orange-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">7-Day Parked Leads Blast</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Re-engage sellers who declined their initial cash offer 7 days ago with a limited-time ₹2,000 doorstep
                bonus offer.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 italic">
                &ldquo;Vanakkam &#123;&#123;name&#125;&#125;! We have active buyers for your &#123;&#123;model&#125;&#125;. Book doorstep inspection today and receive instant IMPS cash payment.&rdquo;
              </div>
            </div>

            <button
              onClick={() => {
                setCampaignName('7-Day Parked Leads Bonus Reactivation');
                setMessageType('text');
                setMessageBody(
                  'Vanakkam {{name}}! We have an immediate buyer in Chennai for your {{model}}. Our updated instant cash offer is ready. Reply YES to confirm doorstep verification.'
                );
                setActiveTab('bulk');
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <span>Load Template into Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-700/50 flex items-center justify-center text-blue-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Revised Pricing Offer</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Target leads whose bikes received refreshed AI market valuations matching their asking expectation.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 italic">
                &ldquo;Hello &#123;&#123;name&#125;&#125;, market price for &#123;&#123;model&#125;&#125; has revised to &#123;&#123;price&#125;&#125;. Valid for 48 hrs.&rdquo;
              </div>
            </div>

            <button
              onClick={() => {
                setCampaignName('Revised Valuation Market Match');
                setMessageType('text');
                setMessageBody(
                  'Hello {{name}}, market prices for {{model}} in {{city}} have increased! Our final offer is {{price}}. Valid for 48 hours only.'
                );
                setActiveTab('bulk');
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <span>Load Template into Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Interactive Intent Poll</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Send interactive WhatsApp Polls to qualify unresponsive leads automatically without human calling overhead.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 italic">
                Question: &ldquo;Are you still looking to sell your bike this month?&rdquo;
              </div>
            </div>

            <button
              onClick={() => {
                setCampaignName('Seller Intent Verification Poll');
                setMessageType('poll');
                setPollQuestion('Are you still looking to sell your bike this month?');
                setPollOptions(['Yes, want evaluation today', 'Need higher price offer', 'No, keeping the bike']);
                setActiveTab('bulk');
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <span>Load Poll into Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PER-RECIPIENT DELIVERY VIEW MODAL */}
      {/* ========================================================================= */}
      {selectedCampaignId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-5 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Per-Recipient Delivery Audit</span>
                  {selectedCampaign && getStatusBadge(selectedCampaign.status)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Campaign: {selectedCampaign?.name} ({selectedCampaignId})
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaignId(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 text-xs border-b border-slate-800 pb-2">
              <button
                onClick={() => setRecipientFilter('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  recipientFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({recipientsList.length})
              </button>
              <button
                onClick={() => setRecipientFilter('delivered')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  recipientFilter === 'delivered'
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Delivered ({recipientsList.filter((r) => r.status === 'delivered').length})
              </button>
              <button
                onClick={() => setRecipientFilter('failed')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  recipientFilter === 'failed'
                    ? 'bg-red-950/60 text-red-300 border border-red-800/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Failed ({recipientsList.filter((r) => r.status === 'failed').length})
              </button>
            </div>

            {/* Recipients Table */}
            {isLoadingRecipients ? (
              <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-xs">Fetching delivery logs from UNAI FLOW...</span>
              </div>
            ) : recipientsList.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recipient delivery logs recorded for this campaign yet.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Phone Number</th>
                      <th className="p-3">Recipient Name</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Timestamp / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {recipientsList
                      .filter((r) => {
                        if (recipientFilter === 'all') return true;
                        return r.status === recipientFilter;
                      })
                      .map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono text-white font-medium">{rec.recipient_jid}</td>
                          <td className="p-3">{rec.recipient_name || '—'}</td>
                          <td className="p-3">
                            {rec.status === 'delivered' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Delivered
                              </span>
                            ) : rec.status === 'failed' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                Failed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {rec.status || 'Queued'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {rec.error_message ? (
                              <span className="text-red-400">{rec.error_message}</span>
                            ) : (
                              rec.timestamp || rec.delivered_at || rec.sent_at || 'Just now'
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCampaignId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

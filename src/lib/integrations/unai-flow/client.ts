import {
  MessagingProvider,
  UnaiFlowCredentials,
  IntegrationStatus,
  SingleMessagePayload,
  CampaignPayload,
  CampaignResult,
  QuickSendPayload,
  CampaignRecipientStatus,
} from '../types';

export class UnaiFlowClient implements MessagingProvider {
  name = 'unai_flow';

  /**
   * Validates and sanitizes the base URL, preventing SSRF to cloud metadata or prohibited domains.
   */
  public sanitizeBaseUrl(rawUrl?: string): string {
    const fallback =
      process.env.UNAI_FLOW_API_BASE_URL ||
      process.env.NEXT_PUBLIC_UNAI_FLOW_API_BASE_URL ||
      'https://unai-flow-backend-w4al.onrender.com';
    const targetUrl = rawUrl && rawUrl.trim() ? rawUrl.trim() : fallback;

    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      throw new Error('Invalid UNAI FLOW API Base URL.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('UNAI FLOW Base URL must use HTTP or HTTPS.');
    }

    const host = parsed.hostname.toLowerCase();
    // SSRF Guard against cloud metadata targets
    if (
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host.endsWith('.internal') ||
      host === '0.0.0.0'
    ) {
      throw new Error('Prohibited host target in UNAI FLOW Base URL.');
    }

    return targetUrl.replace(/\/+$/, '');
  }

  /**
   * Helper to sleep for ms.
   */
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper to perform authenticated fetch with timeout, cold-start (503) retry, and safe error handling.
   */
  private async executeFetch(
    baseUrl: string,
    path: string,
    apiKey: string,
    options: RequestInit = {},
    timeoutMs = 15000,
    retryCount = 0
  ): Promise<{ ok: boolean; status: number; data: any; networkError?: boolean; errorMessage?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const fullUrl = `${baseUrl}${path}`;
    const cleanApiKey = apiKey.trim();

    const headers: Record<string, string> = {
      'X-API-Key': cleanApiKey,
      'Authorization': `Bearer ${cleanApiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Vikaalam-CRM-Integration/1.0',
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Handle 503 Cold Start Retry (max 2 retries, 2.5s delay)
      if (response.status === 503 && retryCount < 2) {
        await this.sleep(2500);
        return this.executeFetch(baseUrl, path, apiKey, options, timeoutMs, retryCount + 1);
      }

      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      let errorMessage: string | undefined;
      if (!response.ok) {
        if (response.status === 401) {
          errorMessage = 'Invalid API key — please re-enter in Settings';
        } else if (response.status === 403) {
          errorMessage = 'Missing permissions — check UNAI FLOW application scopes';
        } else if (response.status === 422) {
          const detail = data?.detail || data?.error?.message || data?.error;
          errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail || 'Validation error');
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please back off and retry shortly.';
        } else if (response.status === 503) {
          errorMessage = 'UNAI FLOW backend is warming up (cold start). Please retry in a few seconds.';
        } else {
          errorMessage =
            data?.error?.message || data?.detail || data?.message || `UNAI FLOW returned error HTTP ${response.status}`;
        }
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
        errorMessage,
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err.name === 'AbortError';

      // If network failure / timeout and we haven't exhausted retries on potential cold start
      if (retryCount < 2 && !isTimeout) {
        await this.sleep(2000);
        return this.executeFetch(baseUrl, path, apiKey, options, timeoutMs, retryCount + 1);
      }

      return {
        ok: false,
        status: isTimeout ? 504 : 503,
        data: null,
        networkError: true,
        errorMessage: isTimeout
          ? 'Request to UNAI FLOW timed out after 15 seconds'
          : `Network error connecting to UNAI FLOW: ${err.message}`,
      };
    }
  }

  /**
   * Tests credentials against UNAI FLOW API via GET /v1/auth/verify.
   */
  async testConnection(credentials: UnaiFlowCredentials): Promise<{
    success: boolean;
    status: IntegrationStatus;
    whatsappNumber?: string;
    applicationId?: string;
    applicationName?: string;
    instanceId?: string;
    scopes?: string[];
    error?: string;
  }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      if (!apiKey || !apiKey.trim()) {
        return {
          success: false,
          status: 'INVALID_CREDENTIALS',
          error: 'UNAI FLOW API Key is required.',
        };
      }

      const res = await this.executeFetch(baseUrl, '/v1/auth/verify', apiKey, { method: 'GET' });

      if (!res.ok) {
        return {
          success: false,
          status: res.status === 401 ? 'INVALID_CREDENTIALS' : 'API_ERROR',
          error: res.errorMessage || 'Failed to authenticate with UNAI FLOW',
        };
      }

      const data = res.data || {};
      const isValid = data.valid === true;

      if (!isValid) {
        return {
          success: false,
          status: 'INVALID_CREDENTIALS',
          error: 'UNAI FLOW reported invalid API Key credentials.',
        };
      }

      const whatsapp = data.whatsapp || {};
      const app = data.application || {};

      const phone = whatsapp.whatsapp_number
        ? whatsapp.whatsapp_number.startsWith('+')
          ? whatsapp.whatsapp_number
          : `+${whatsapp.whatsapp_number}`
        : '+919342745299';

      return {
        success: true,
        status: whatsapp.status === 'CONNECTED' || whatsapp.is_connected ? 'CONNECTED' : 'WHATSAPP_NOT_CONNECTED',
        whatsappNumber: phone,
        applicationId: app.id || credentials.applicationId,
        applicationName: app.name || 'CRM',
        scopes: app.scopes || [],
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'UNKNOWN_ERROR',
        error: err.message || 'An unexpected error occurred testing UNAI FLOW connection.',
      };
    }
  }

  /**
   * Creates a draft campaign on UNAI FLOW.
   * Endpoint: POST /v1/campaigns
   */
  async createCampaign(
    credentials: UnaiFlowCredentials,
    payload: CampaignPayload
  ): Promise<{ success: boolean; campaign?: CampaignResult; error?: string }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      const formattedRecipients = payload.recipients.map((r) => {
        let jid = r.recipient_jid.trim();
        if (!jid.includes('@')) {
          const digits = jid.replace(/\D/g, '');
          jid = digits.startsWith('+') ? digits : `+${digits}`;
        }
        return {
          recipient_jid: jid,
          recipient_name: r.recipient_name || '',
          variables: r.variables || {},
        };
      });

      const body = {
        name: payload.name,
        message_type: payload.message_type || 'text',
        message_payload: payload.message_payload,
        recipients: formattedRecipients,
        messages_per_second: payload.messages_per_second || 2.0,
      };

      const idempotencyKey = `camp_create_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await this.executeFetch(baseUrl, '/v1/campaigns', apiKey, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        return {
          success: false,
          error: res.errorMessage || 'Failed to create campaign on UNAI FLOW',
        };
      }

      return {
        success: true,
        campaign: res.data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error creating bulk campaign.',
      };
    }
  }

  /**
   * Launches an existing draft campaign.
   * Endpoint: POST /v1/campaigns/{id}/launch
   */
  async launchCampaign(
    credentials: UnaiFlowCredentials,
    campaignId: string
  ): Promise<{ success: boolean; status?: string; queuedCount?: number; error?: string }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      const idempotencyKey = `camp_launch_${campaignId}_${Date.now()}`;

      const res = await this.executeFetch(baseUrl, `/v1/campaigns/${campaignId}/launch`, apiKey, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });

      if (!res.ok) {
        return {
          success: false,
          error: res.errorMessage || 'Failed to launch campaign on UNAI FLOW',
        };
      }

      return {
        success: true,
        status: res.data?.status || 'queued',
        queuedCount: res.data?.queued_count,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error launching campaign.',
      };
    }
  }

  /**
   * Fetches real-time status and delivery metrics for a campaign.
   * Endpoint: GET /v1/campaigns/{id}
   */
  async getCampaignStatus(
    credentials: UnaiFlowCredentials,
    campaignId: string
  ): Promise<{ success: boolean; campaign?: CampaignResult; error?: string }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      const res = await this.executeFetch(baseUrl, `/v1/campaigns/${campaignId}`, apiKey, {
        method: 'GET',
      });

      if (!res.ok) {
        return {
          success: false,
          error: res.errorMessage || `Failed to fetch status for campaign ${campaignId}`,
        };
      }

      return {
        success: true,
        campaign: res.data,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error querying campaign status.',
      };
    }
  }

  /**
   * Fetches paginated campaigns list.
   * Endpoint: GET /v1/campaigns?page=1&page_size=20
   */
  async getCampaigns(
    credentials: UnaiFlowCredentials,
    page = 1,
    pageSize = 20
  ): Promise<{ success: boolean; campaigns: CampaignResult[]; total: number; error?: string }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      const res = await this.executeFetch(baseUrl, `/v1/campaigns?page=${page}&page_size=${pageSize}`, apiKey, {
        method: 'GET',
      });

      if (!res.ok) {
        return {
          success: false,
          campaigns: [],
          total: 0,
          error: res.errorMessage || 'Failed to fetch campaigns list',
        };
      }

      const campaigns = Array.isArray(res.data?.campaigns) ? res.data.campaigns : [];
      const total = typeof res.data?.total === 'number' ? res.data.total : campaigns.length;

      return {
        success: true,
        campaigns,
        total,
      };
    } catch (err: any) {
      return {
        success: false,
        campaigns: [],
        total: 0,
        error: err.message || 'Error fetching campaigns',
      };
    }
  }

  /**
   * Fetches recipient breakdown for a campaign.
   * Endpoint: GET /v1/campaigns/{id}/recipients?page=1&page_size=50
   */
  async getCampaignRecipients(
    credentials: UnaiFlowCredentials,
    campaignId: string,
    page = 1,
    pageSize = 50
  ): Promise<{ success: boolean; recipients: CampaignRecipientStatus[]; total: number; error?: string }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      const res = await this.executeFetch(
        baseUrl,
        `/v1/campaigns/${campaignId}/recipients?page=${page}&page_size=${pageSize}`,
        apiKey,
        { method: 'GET' }
      );

      if (!res.ok) {
        return {
          success: false,
          recipients: [],
          total: 0,
          error: res.errorMessage || 'Failed to fetch campaign recipients',
        };
      }

      const recipients = Array.isArray(res.data?.recipients)
        ? res.data.recipients
        : Array.isArray(res.data)
        ? res.data
        : [];
      const total = typeof res.data?.total === 'number' ? res.data.total : recipients.length;

      return {
        success: true,
        recipients,
        total,
      };
    } catch (err: any) {
      return {
        success: false,
        recipients: [],
        total: 0,
        error: err.message || 'Error fetching recipient details',
      };
    }
  }

  /**
   * Cancels an active or queued campaign.
   * Endpoint: POST /v1/campaigns/{id}/cancel
   */
  async cancelCampaign(
    credentials: UnaiFlowCredentials,
    campaignId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      const res = await this.executeFetch(baseUrl, `/v1/campaigns/${campaignId}/cancel`, apiKey, {
        method: 'POST',
      });

      if (!res.ok) {
        return {
          success: false,
          error: res.errorMessage || 'Failed to cancel campaign on UNAI FLOW',
        };
      }

      return {
        success: true,
        message: res.data?.message || 'Campaign cancelled successfully',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error cancelling campaign',
      };
    }
  }

  /**
   * Quick Single/Bulk message send in one API call.
   * Endpoint: POST /v1/messages/send
   */
  async sendQuickMessage(
    credentials: UnaiFlowCredentials,
    payload: QuickSendPayload
  ): Promise<{ success: boolean; campaignId?: string; totalRecipients?: number; error?: string }> {
    try {
      const baseUrl = this.sanitizeBaseUrl(credentials.baseUrl);
      const apiKey = credentials.apiKey;

      const formattedTo = payload.to.map((phone) => {
        const clean = phone.trim();
        if (clean.startsWith('+')) return clean;
        const digits = clean.replace(/\D/g, '');
        return `+${digits}`;
      });

      const body = {
        to: formattedTo,
        message: payload.message,
        message_type: payload.message_type || 'text',
        campaign_name: payload.campaign_name || 'Quick Blast',
        ...(payload.media_url ? { media_url: payload.media_url } : {}),
      };

      const idempotencyKey = `quick_send_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const res = await this.executeFetch(baseUrl, '/v1/messages/send', apiKey, {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        return {
          success: false,
          error: res.errorMessage || 'Failed to dispatch quick WhatsApp blast',
        };
      }

      return {
        success: true,
        campaignId: res.data?.campaign_id || res.data?.id,
        totalRecipients: res.data?.total_recipients || formattedTo.length,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error dispatching quick messages',
      };
    }
  }

  /**
   * Sends a single text message through UNAI FLOW.
   * Endpoint: POST /v1/messages/text or POST /v1/messages/send
   */
  async sendSingleMessage(
    credentials: UnaiFlowCredentials,
    payload: SingleMessagePayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendQuickMessage(credentials, {
      to: [payload.recipient_jid],
      message: payload.message,
      campaign_name: 'Single Lead Message',
    }).then((res) => ({
      success: res.success,
      messageId: res.campaignId,
      error: res.error,
    }));
  }
}

export const unaiFlowClient = new UnaiFlowClient();

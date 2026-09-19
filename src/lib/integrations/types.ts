export type IntegrationStatus =
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'INVALID_CREDENTIALS'
  | 'WHATSAPP_NOT_CONNECTED'
  | 'API_ERROR'
  | 'REVOKED'
  | 'UNKNOWN_ERROR';

export interface UnaiFlowCredentials {
  applicationId?: string;
  clientId?: string;
  clientSecret?: string;
  apiKey: string;
  apiSecret?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  baseUrl?: string;
}

export interface IntegrationRecord {
  id: string;
  organizationId: string;
  userId?: string;
  provider: 'unai_flow' | 'zoho_payment' | string;
  integrationType: 'whatsapp_bulk' | 'payment_gateway' | string;
  applicationId?: string;
  clientId?: string;
  baseUrl: string;
  status: IntegrationStatus;
  whatsappNumber?: string;
  maskedApiKey?: string;
  maskedClientSecret?: string;
  metadata?: Record<string, any>;
  lastTestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRecipient {
  recipient_jid: string;
  recipient_name?: string;
  variables?: Record<string, string | number>;
}

export interface CampaignPayload {
  name: string;
  message_type?: 'text' | 'image' | 'video' | 'audio' | 'poll';
  message_payload: {
    body?: string;
    media_url?: string;
    caption?: string;
    poll?: {
      question: string;
      options: string[];
    };
  };
  recipients: CampaignRecipient[];
  messages_per_second?: number;
  instance_id?: string;
}

export interface QuickSendPayload {
  to: string[];
  message: string;
  message_type?: 'text' | 'image' | 'video' | 'audio';
  campaign_name?: string;
  media_url?: string;
}

export interface CampaignRecipientStatus {
  id?: string;
  recipient_jid: string;
  recipient_name?: string;
  status: 'pending' | 'queued' | 'sending' | 'delivered' | 'failed';
  error_message?: string;
  timestamp?: string;
  sent_at?: string;
  delivered_at?: string;
}

export interface CampaignResult {
  id: string;
  name: string;
  status: 'draft' | 'queued' | 'sending' | 'completed' | 'partial_failure' | 'failed' | 'cancelled';
  total_recipients: number;
  queued_count: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  launched_at?: string;
  completed_at?: string;
  error?: string;
}

export interface SingleMessagePayload {
  recipient_jid: string;
  message: string;
  instance_id?: string;
}

export interface MessagingProvider {
  name: string;
  testConnection(credentials: UnaiFlowCredentials): Promise<{
    success: boolean;
    status: IntegrationStatus;
    whatsappNumber?: string;
    instanceId?: string;
    error?: string;
  }>;
  sendSingleMessage(
    credentials: UnaiFlowCredentials,
    payload: SingleMessagePayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }>;
  createCampaign(
    credentials: UnaiFlowCredentials,
    payload: CampaignPayload
  ): Promise<{ success: boolean; campaign?: CampaignResult; error?: string }>;
  launchCampaign(
    credentials: UnaiFlowCredentials,
    campaignId: string
  ): Promise<{ success: boolean; status?: string; error?: string }>;
  getCampaignStatus(
    credentials: UnaiFlowCredentials,
    campaignId: string
  ): Promise<{ success: boolean; campaign?: CampaignResult; error?: string }>;
}

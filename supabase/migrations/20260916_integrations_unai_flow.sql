-- ====================================================================
-- Migration: 20260916_integrations_unai_flow.sql
-- Description: Adds integrations management, UNAI FLOW WhatsApp Bulk
--              Messaging tables, campaign job tracking, and RLS policies.
-- ====================================================================

-- 1. Enable pgcrypto extension if not enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Integrations Table (Supports generic integrations: UNAI FLOW, Zoho Payment, etc.)
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL DEFAULT 'org_default',
    user_id TEXT,
    provider TEXT NOT NULL, -- e.g. 'unai_flow', 'zoho_payment'
    integration_type TEXT NOT NULL, -- e.g. 'whatsapp_bulk', 'payment_gateway'
    application_id TEXT,
    client_id TEXT,
    encrypted_client_secret TEXT,
    encrypted_api_key TEXT,
    encrypted_api_secret TEXT,
    oauth_client_id TEXT,
    encrypted_oauth_client_secret TEXT,
    base_url TEXT DEFAULT 'http://localhost:8000',
    status TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    -- Statuses: 'NOT_CONNECTED', 'CONNECTING', 'CONNECTED', 'INVALID_CREDENTIALS',
    --           'WHATSAPP_NOT_CONNECTED', 'API_ERROR', 'REVOKED', 'UNKNOWN_ERROR'
    whatsapp_number TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_tested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_org_provider_type UNIQUE (organization_id, provider, integration_type)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_integrations_lookup 
    ON integrations (organization_id, provider, status);

-- 3. WhatsApp Campaign Jobs Table
CREATE TABLE IF NOT EXISTS whatsapp_campaign_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL DEFAULT 'org_default',
    provider TEXT NOT NULL DEFAULT 'unai_flow',
    external_campaign_id TEXT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    -- Statuses: 'draft', 'queued', 'sending', 'completed', 'partial_failure', 'failed', 'cancelled'
    total_recipients INTEGER NOT NULL DEFAULT 0,
    queued_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    messages_per_second NUMERIC(4, 2) DEFAULT 2.0,
    message_payload JSONB DEFAULT '{}'::jsonb,
    recipients JSONB DEFAULT '[]'::jsonb,
    launched_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_org_status 
    ON whatsapp_campaign_jobs (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_ext_id 
    ON whatsapp_campaign_jobs (external_campaign_id);

-- 4. WhatsApp Messages Log Table
CREATE TABLE IF NOT EXISTS whatsapp_messages_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_job_id UUID REFERENCES whatsapp_campaign_jobs(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL DEFAULT 'org_default',
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    provider_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'queued',
    -- Statuses: 'queued', 'sending', 'delivered', 'failed'
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_log_campaign 
    ON whatsapp_messages_log (campaign_job_id);
CREATE INDEX IF NOT EXISTS idx_messages_log_phone 
    ON whatsapp_messages_log (recipient_phone);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campaign_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages_log ENABLE ROW LEVEL SECURITY;

-- Integrations RLS: Allow authenticated tenant users to read non-secret columns, or service role full access
CREATE POLICY "Tenant isolation for integrations SELECT"
    ON integrations FOR SELECT
    USING (
        organization_id = coalesce(current_setting('request.jwt.claims', true)::json->>'org_id', 'org_default')
        OR current_setting('role', true) = 'service_role'
    );

CREATE POLICY "Tenant isolation for integrations INSERT"
    ON integrations FOR INSERT
    WITH CHECK (
        organization_id = coalesce(current_setting('request.jwt.claims', true)::json->>'org_id', 'org_default')
        OR current_setting('role', true) = 'service_role'
    );

CREATE POLICY "Tenant isolation for integrations UPDATE"
    ON integrations FOR UPDATE
    USING (
        organization_id = coalesce(current_setting('request.jwt.claims', true)::json->>'org_id', 'org_default')
        OR current_setting('role', true) = 'service_role'
    );

CREATE POLICY "Tenant isolation for integrations DELETE"
    ON integrations FOR DELETE
    USING (
        organization_id = coalesce(current_setting('request.jwt.claims', true)::json->>'org_id', 'org_default')
        OR current_setting('role', true) = 'service_role'
    );

-- Campaigns RLS
CREATE POLICY "Tenant isolation for whatsapp_campaign_jobs"
    ON whatsapp_campaign_jobs FOR ALL
    USING (
        organization_id = coalesce(current_setting('request.jwt.claims', true)::json->>'org_id', 'org_default')
        OR current_setting('role', true) = 'service_role'
    );

-- Messages Log RLS
CREATE POLICY "Tenant isolation for whatsapp_messages_log"
    ON whatsapp_messages_log FOR ALL
    USING (
        organization_id = coalesce(current_setting('request.jwt.claims', true)::json->>'org_id', 'org_default')
        OR current_setting('role', true) = 'service_role'
    );

-- 6. Seed Zoho Payment Integration Reference
INSERT INTO integrations (
    organization_id,
    provider,
    integration_type,
    application_id,
    client_id,
    status,
    metadata,
    last_tested_at
) VALUES (
    'org_default',
    'zoho_payment',
    'payment_gateway',
    'app_zoho_pay_vklm',
    '1000.ZOHO_CLIENT_9921',
    'CONNECTED',
    '{"merchant_id": "ZOHO_MERCHANT_4821", "account_name": "Vikaalam Motors Escrow", "currency": "INR", "webhook_enabled": true}'::jsonb,
    now() - INTERVAL '2 hours'
) ON CONFLICT (organization_id, provider, integration_type) DO NOTHING;

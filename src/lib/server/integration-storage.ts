import fs from 'fs';
import path from 'path';
import { getSupabaseServerClient } from '../supabase/server';
import { encryptSecret, decryptSecret, maskSecret } from './crypto';
import { IntegrationRecord, IntegrationStatus, UnaiFlowCredentials } from '../integrations/types';

const FALLBACK_STORAGE_DIR = path.join(process.cwd(), '.gemini_storage');
const FALLBACK_FILE = path.join(FALLBACK_STORAGE_DIR, 'integrations.json');

// Ensure fallback dir exists
function ensureStorageDir() {
  if (!fs.existsSync(FALLBACK_STORAGE_DIR)) {
    try {
      fs.mkdirSync(FALLBACK_STORAGE_DIR, { recursive: true });
    } catch (e) {
      // ignore
    }
  }
}

function readFallbackData(): Record<string, any> {
  ensureStorageDir();
  if (fs.existsSync(FALLBACK_FILE)) {
    try {
      const content = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return {};
    }
  }
  return {};
}

function writeFallbackData(data: Record<string, any>) {
  ensureStorageDir();
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write local integration storage:', e);
  }
}

export class IntegrationStorage {
  /**
   * Saves or updates an integration record. Encrypts sensitive fields at rest.
   */
  static async saveIntegration(
    orgId: string,
    provider: string,
    integrationType: string,
    params: {
      applicationId?: string;
      clientId?: string;
      clientSecret?: string;
      apiKey?: string;
      apiSecret?: string;
      oauthClientId?: string;
      oauthClientSecret?: string;
      baseUrl?: string;
      status: IntegrationStatus;
      whatsappNumber?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<IntegrationRecord> {
    const encryptedClientSecret = params.clientSecret ? encryptSecret(params.clientSecret) : '';
    const encryptedApiKey = params.apiKey ? encryptSecret(params.apiKey) : '';
    const encryptedApiSecret = params.apiSecret ? encryptSecret(params.apiSecret) : '';
    const encryptedOAuthSecret = params.oauthClientSecret ? encryptSecret(params.oauthClientSecret) : '';

    const supabase = getSupabaseServerClient();
    const now = new Date().toISOString();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('integrations')
          .upsert(
            {
              organization_id: orgId,
              provider,
              integration_type: integrationType,
              application_id: params.applicationId,
              client_id: params.clientId,
              encrypted_client_secret: encryptedClientSecret,
              encrypted_api_key: encryptedApiKey,
              encrypted_api_secret: encryptedApiSecret,
              oauth_client_id: params.oauthClientId,
              encrypted_oauth_client_secret: encryptedOAuthSecret,
              base_url: params.baseUrl || 'http://localhost:8000',
              status: params.status,
              whatsapp_number: params.whatsappNumber,
              metadata: params.metadata || {},
              last_tested_at: now,
              updated_at: now,
            },
            { onConflict: 'organization_id,provider,integration_type' }
          )
          .select()
          .single();

        if (data && !error) {
          return {
            id: data.id,
            organizationId: data.organization_id,
            provider: data.provider,
            integrationType: data.integration_type,
            applicationId: data.application_id,
            clientId: data.client_id,
            baseUrl: data.base_url,
            status: data.status,
            whatsappNumber: data.whatsapp_number,
            maskedApiKey: params.apiKey ? maskSecret(params.apiKey) : undefined,
            maskedClientSecret: params.clientSecret ? maskSecret(params.clientSecret) : undefined,
            metadata: data.metadata,
            lastTestedAt: data.last_tested_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (e) {
        console.warn('Supabase integration save failed, using local storage fallback:', e);
      }
    }

    // Fallback persistent storage
    const storage = readFallbackData();
    const key = `${orgId}:${provider}:${integrationType}`;
    const existing = storage[key] || {
      id: `int_${Date.now()}`,
      createdAt: now,
    };

    const record = {
      ...existing,
      organizationId: orgId,
      provider,
      integrationType,
      applicationId: params.applicationId,
      clientId: params.clientId,
      encrypted_client_secret: encryptedClientSecret,
      encrypted_api_key: encryptedApiKey,
      encrypted_api_secret: encryptedApiSecret,
      oauth_client_id: params.oauthClientId,
      encrypted_oauth_client_secret: encryptedOAuthSecret,
      baseUrl: params.baseUrl || 'http://localhost:8000',
      status: params.status,
      whatsappNumber: params.whatsappNumber,
      metadata: params.metadata || {},
      lastTestedAt: now,
      updatedAt: now,
    };

    storage[key] = record;
    writeFallbackData(storage);

    return {
      id: record.id,
      organizationId: orgId,
      provider,
      integrationType,
      applicationId: params.applicationId,
      clientId: params.clientId,
      baseUrl: record.baseUrl,
      status: params.status,
      whatsappNumber: params.whatsappNumber,
      maskedApiKey: params.apiKey ? maskSecret(params.apiKey) : undefined,
      maskedClientSecret: params.clientSecret ? maskSecret(params.clientSecret) : undefined,
      metadata: record.metadata,
      lastTestedAt: record.lastTestedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Retrieves sanitized integration record for frontend display (no plaintext secrets).
   */
  static async getIntegration(
    orgId: string,
    provider: string,
    integrationType: string
  ): Promise<IntegrationRecord | null> {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('integrations')
          .select('*')
          .eq('organization_id', orgId)
          .eq('provider', provider)
          .eq('integration_type', integrationType)
          .maybeSingle();

        if (data && !error) {
          const rawApiKey = data.encrypted_api_key ? decryptSecret(data.encrypted_api_key) : '';
          const rawClientSecret = data.encrypted_client_secret ? decryptSecret(data.encrypted_client_secret) : '';

          return {
            id: data.id,
            organizationId: data.organization_id,
            provider: data.provider,
            integrationType: data.integration_type,
            applicationId: data.application_id,
            clientId: data.client_id,
            baseUrl: data.base_url || 'http://localhost:8000',
            status: data.status,
            whatsappNumber: data.whatsapp_number,
            maskedApiKey: rawApiKey ? maskSecret(rawApiKey) : undefined,
            maskedClientSecret: rawClientSecret ? maskSecret(rawClientSecret) : undefined,
            metadata: data.metadata,
            lastTestedAt: data.last_tested_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (e) {
        console.warn('Supabase fetch failed, checking local storage:', e);
      }
    }

    // Check fallback
    const storage = readFallbackData();
    const key = `${orgId}:${provider}:${integrationType}`;
    const record = storage[key];

    if (!record) return null;

    const rawApiKey = record.encrypted_api_key ? decryptSecret(record.encrypted_api_key) : '';
    const rawClientSecret = record.encrypted_client_secret ? decryptSecret(record.encrypted_client_secret) : '';

    return {
      id: record.id,
      organizationId: record.organizationId,
      provider: record.provider,
      integrationType: record.integrationType,
      applicationId: record.applicationId,
      clientId: record.clientId,
      baseUrl: record.baseUrl || 'http://localhost:8000',
      status: record.status,
      whatsappNumber: record.whatsappNumber,
      maskedApiKey: rawApiKey ? maskSecret(rawApiKey) : undefined,
      maskedClientSecret: rawClientSecret ? maskSecret(rawClientSecret) : undefined,
      metadata: record.metadata,
      lastTestedAt: record.lastTestedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Retrieves decrypted credentials for secure backend/edge use ONLY.
   */
  static async getDecryptedCredentials(
    orgId: string,
    provider: string,
    integrationType: string
  ): Promise<UnaiFlowCredentials | null> {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      try {
        const { data } = await supabase
          .from('integrations')
          .select('*')
          .eq('organization_id', orgId)
          .eq('provider', provider)
          .eq('integration_type', integrationType)
          .maybeSingle();

        if (data) {
          return {
            applicationId: data.application_id,
            clientId: data.client_id,
            clientSecret: data.encrypted_client_secret ? decryptSecret(data.encrypted_client_secret) : '',
            apiKey: data.encrypted_api_key ? decryptSecret(data.encrypted_api_key) : '',
            apiSecret: data.encrypted_api_secret ? decryptSecret(data.encrypted_api_secret) : '',
            oauthClientId: data.oauth_client_id,
            oauthClientSecret: data.encrypted_oauth_client_secret ? decryptSecret(data.encrypted_oauth_client_secret) : '',
            baseUrl: data.base_url || 'http://localhost:8000',
          };
        }
      } catch (e) {
        console.warn('Supabase fetch failed in getDecryptedCredentials:', e);
      }
    }

    const storage = readFallbackData();
    const key = `${orgId}:${provider}:${integrationType}`;
    const record = storage[key];

    if (!record) return null;

    return {
      applicationId: record.applicationId,
      clientId: record.clientId,
      clientSecret: record.encrypted_client_secret ? decryptSecret(record.encrypted_client_secret) : '',
      apiKey: record.encrypted_api_key ? decryptSecret(record.encrypted_api_key) : '',
      apiSecret: record.encrypted_api_secret ? decryptSecret(record.encrypted_api_secret) : '',
      oauthClientId: record.oauth_client_id,
      oauthClientSecret: record.encrypted_oauth_client_secret ? decryptSecret(record.encrypted_oauth_client_secret) : '',
      baseUrl: record.baseUrl || 'http://localhost:8000',
    };
  }

  /**
   * Disconnects an integration and clears secrets.
   */
  static async disconnectIntegration(
    orgId: string,
    provider: string,
    integrationType: string
  ): Promise<boolean> {
    const supabase = getSupabaseServerClient();

    if (supabase) {
      try {
        await supabase
          .from('integrations')
          .update({
            status: 'NOT_CONNECTED',
            encrypted_api_key: null,
            encrypted_client_secret: null,
            encrypted_api_secret: null,
            encrypted_oauth_client_secret: null,
            whatsapp_number: null,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', orgId)
          .eq('provider', provider)
          .eq('integration_type', integrationType);
      } catch (e) {
        // ignore
      }
    }

    const storage = readFallbackData();
    const key = `${orgId}:${provider}:${integrationType}`;
    if (storage[key]) {
      storage[key] = {
        ...storage[key],
        status: 'NOT_CONNECTED',
        encrypted_api_key: null,
        encrypted_client_secret: null,
        encrypted_api_secret: null,
        encrypted_oauth_client_secret: null,
        whatsappNumber: null,
        updatedAt: new Date().toISOString(),
      };
      writeFallbackData(storage);
    }

    return true;
  }
}

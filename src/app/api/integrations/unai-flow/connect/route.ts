import { NextRequest, NextResponse } from 'next/server';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';
import { IntegrationStorage } from '@/lib/server/integration-storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      apiKey,
      clientId,
      clientSecret,
      apiSecret,
      oauthClientId,
      oauthClientSecret,
      applicationId,
      baseUrl = 'https://unai-flow-backend-w4al.onrender.com',
      orgId = 'org_default',
    } = body;

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, status: 'INVALID_CREDENTIALS', error: 'UNAI FLOW API Key is required.' },
        { status: 400 }
      );
    }

    // 1. Verify credentials against UNAI FLOW
    const testResult = await unaiFlowClient.testConnection({
      apiKey: apiKey.trim(),
      clientId: clientId?.trim(),
      clientSecret: clientSecret?.trim(),
      applicationId: applicationId?.trim(),
      baseUrl: baseUrl?.trim(),
    });

    if (!testResult.success && testResult.status !== 'CONNECTED') {
      return NextResponse.json(
        {
          success: false,
          status: testResult.status,
          error: testResult.error || 'Connection failed with provided credentials.',
        },
        { status: 400 }
      );
    }

    // 2. Persist with AES-256-GCM encryption
    const saved = await IntegrationStorage.saveIntegration(
      orgId,
      'unai_flow',
      'whatsapp_bulk',
      {
        applicationId: testResult.applicationId || applicationId?.trim() || 'unai_crm_app',
        clientId: clientId?.trim(),
        clientSecret: clientSecret?.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret?.trim(),
        oauthClientId: oauthClientId?.trim(),
        oauthClientSecret: oauthClientSecret?.trim(),
        baseUrl: baseUrl?.trim() || 'https://unai-flow-backend-w4al.onrender.com',
        status: 'CONNECTED',
        whatsappNumber: testResult.whatsappNumber || '+919342745299',
        metadata: {
          application_name: testResult.applicationName || 'CRM',
          scopes: testResult.scopes || [],
          connected_via: 'developer_console',
        },
      }
    );

    return NextResponse.json({
      success: true,
      provider: 'unai_flow',
      status: saved.status,
      whatsapp_number: saved.whatsappNumber,
      masked_api_key: saved.maskedApiKey,
      masked_client_secret: saved.maskedClientSecret,
      last_tested_at: saved.lastTestedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, status: 'UNKNOWN_ERROR', error: err.message || 'Error connecting UNAI FLOW' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';
import { IntegrationStorage } from '@/lib/server/integration-storage';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }

    let { apiKey, clientId, clientSecret, baseUrl, applicationId, orgId = 'org_default' } = body;

    // If apiKey is not provided in body, check secure stored credentials
    if (!apiKey || !apiKey.trim()) {
      const stored = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
      if (stored && stored.apiKey) {
        apiKey = stored.apiKey;
        clientId = clientId || stored.clientId;
        clientSecret = clientSecret || stored.clientSecret;
        baseUrl = baseUrl || stored.baseUrl;
        applicationId = applicationId || stored.applicationId;
      } else {
        return NextResponse.json(
          { success: false, status: 'INVALID_CREDENTIALS', error: 'UNAI FLOW API Key is required.' },
          { status: 400 }
        );
      }
    }

    const result = await unaiFlowClient.testConnection({
      apiKey: apiKey.trim(),
      clientId: clientId?.trim(),
      clientSecret: clientSecret?.trim(),
      applicationId: applicationId?.trim(),
      baseUrl: baseUrl?.trim(),
    });

    return NextResponse.json({
      success: result.success,
      provider: 'unai_flow',
      status: result.status,
      whatsapp_number: result.whatsappNumber,
      application_id: result.applicationId,
      application_name: result.applicationName,
      scopes: result.scopes,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, status: 'UNKNOWN_ERROR', error: err.message || 'Server error testing connection' },
      { status: 500 }
    );
  }
}

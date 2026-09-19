import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || 'org_default';

    const record = await IntegrationStorage.getIntegration(orgId, 'unai_flow', 'whatsapp_bulk');

    if (!record) {
      return NextResponse.json({
        success: true,
        provider: 'unai_flow',
        status: 'NOT_CONNECTED',
        whatsapp_number: null,
        last_tested_at: null,
      });
    }

    return NextResponse.json({
      success: true,
      provider: 'unai_flow',
      status: record.status,
      application_id: record.applicationId,
      client_id: record.clientId,
      base_url: record.baseUrl,
      whatsapp_number: record.whatsappNumber,
      masked_api_key: record.maskedApiKey,
      masked_client_secret: record.maskedClientSecret,
      last_tested_at: record.lastTestedAt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, status: 'UNKNOWN_ERROR', error: err.message || 'Error fetching status' },
      { status: 500 }
    );
  }
}

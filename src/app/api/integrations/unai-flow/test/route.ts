import { NextRequest, NextResponse } from 'next/server';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, clientId, clientSecret, baseUrl, applicationId } = body;

    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, status: 'INVALID_CREDENTIALS', error: 'UNAI FLOW API Key is required.' },
        { status: 400 }
      );
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
      instance_id: result.instanceId,
      error: result.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, status: 'UNKNOWN_ERROR', error: err.message || 'Server error testing connection' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, message, orgId = 'org_default' } = body;

    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Recipient phone ("to") and message text are required.' },
        { status: 400 }
      );
    }

    const creds = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        { success: false, error: 'UNAI FLOW integration is not connected.' },
        { status: 403 }
      );
    }

    const res = await unaiFlowClient.sendSingleMessage(creds, {
      recipient_jid: to,
      message,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Failed to dispatch message' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'unai_flow',
      message_id: res.messageId,
      status: 'SENT',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error dispatching message' },
      { status: 500 }
    );
  }
}

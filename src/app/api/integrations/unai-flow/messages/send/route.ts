import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      recipient, // fallback for single string
      message,
      message_type = 'text',
      campaign_name = 'Quick Blast',
      media_url,
      orgId = 'org_default',
    } = body;

    const recipientsList: string[] = Array.isArray(to)
      ? to
      : typeof to === 'string'
      ? [to]
      : recipient
      ? [recipient]
      : [];

    if (!recipientsList.length) {
      return NextResponse.json(
        { success: false, error: 'At least one recipient phone number ("to") is required.' },
        { status: 400 }
      );
    }

    if (!message && message_type === 'text') {
      return NextResponse.json(
        { success: false, error: 'Message content is required.' },
        { status: 400 }
      );
    }

    const creds = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        { success: false, error: 'UNAI FLOW integration not connected. Please configure in Settings -> Integrations.' },
        { status: 403 }
      );
    }

    const res = await unaiFlowClient.sendQuickMessage(creds, {
      to: recipientsList,
      message: message || '',
      message_type,
      campaign_name,
      media_url,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Failed to dispatch messages via UNAI FLOW' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign_id: res.campaignId,
      total_recipients: res.totalRecipients,
      mode: recipientsList.length > 1 ? 'bulk' : 'single',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error sending quick messages' },
      { status: 500 }
    );
  }
}

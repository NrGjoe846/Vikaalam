import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || 'org_default';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const creds = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        { success: false, recipients: [], total: 0, error: 'UNAI FLOW integration not connected' },
        { status: 403 }
      );
    }

    const res = await unaiFlowClient.getCampaignRecipients(creds, campaignId, page, pageSize);

    return NextResponse.json({
      success: res.success,
      recipients: res.recipients,
      total: res.total,
      error: res.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, recipients: [], total: 0, error: err.message || 'Server error querying recipients' },
      { status: 500 }
    );
  }
}

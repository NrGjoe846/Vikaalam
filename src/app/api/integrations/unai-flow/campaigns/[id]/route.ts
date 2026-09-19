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

    const creds = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        { success: false, error: 'Integration not connected' },
        { status: 403 }
      );
    }

    const res = await unaiFlowClient.getCampaignStatus(creds, campaignId);

    if (!res.success || !res.campaign) {
      return NextResponse.json(
        { success: false, error: res.error || 'Failed to fetch status from UNAI FLOW' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      campaign: res.campaign,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error querying campaign' },
      { status: 500 }
    );
  }
}

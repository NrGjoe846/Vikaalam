import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;
    const body = await req.json().catch(() => ({}));
    const orgId = body.orgId || 'org_default';

    const creds = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        { success: false, error: 'UNAI FLOW integration not connected' },
        { status: 403 }
      );
    }

    const res = await unaiFlowClient.cancelCampaign(creds, campaignId);

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || 'Failed to cancel campaign' },
        { status: 502 }
      );
    }

    // Update status in Supabase if exists
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase
          .from('whatsapp_campaign_jobs')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('external_campaign_id', campaignId);
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      message: res.message || 'Campaign cancelled successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error cancelling campaign' },
      { status: 500 }
    );
  }
}

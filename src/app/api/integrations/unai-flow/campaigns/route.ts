import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, messageBody, recipients, messagesPerSecond = 2.0, orgId = 'org_default' } = body;

    if (!messageBody || !recipients || !recipients.length) {
      return NextResponse.json(
        { success: false, error: 'Campaign message body and at least one recipient are required.' },
        { status: 400 }
      );
    }

    // 1. Get decrypted credentials from secure storage
    const creds = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAI FLOW integration is not connected. Please connect in Settings -> Integrations first.',
        },
        { status: 403 }
      );
    }

    // 2. Create campaign on UNAI FLOW
    const createRes = await unaiFlowClient.createCampaign(creds, {
      name: name || `Reactivation Broadcast ${new Date().toLocaleDateString()}`,
      message_type: 'text',
      message_payload: {
        body: messageBody,
      },
      recipients,
      messages_per_second: messagesPerSecond,
    });

    if (!createRes.success || !createRes.campaign) {
      return NextResponse.json(
        { success: false, error: createRes.error || 'Failed to stage campaign on UNAI FLOW' },
        { status: 502 }
      );
    }

    const campaignId = createRes.campaign.id;

    // 3. Launch campaign on UNAI FLOW
    const launchRes = await unaiFlowClient.launchCampaign(creds, campaignId);
    if (!launchRes.success) {
      return NextResponse.json(
        { success: false, error: launchRes.error || 'Failed to launch campaign on UNAI FLOW' },
        { status: 502 }
      );
    }

    // 4. Save campaign record in database / Supabase
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase.from('whatsapp_campaign_jobs').insert({
          organization_id: orgId,
          provider: 'unai_flow',
          external_campaign_id: campaignId,
          name: name || `Reactivation Broadcast`,
          status: 'queued',
          total_recipients: recipients.length,
          queued_count: recipients.length,
          messages_per_second: messagesPerSecond,
          message_payload: { body: messageBody },
          recipients: recipients,
          launched_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not write to Supabase whatsapp_campaign_jobs:', e);
      }
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaignId,
        name: createRes.campaign.name,
        status: 'queued',
        total_recipients: recipients.length,
        queued_count: recipients.length,
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        launched_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server error creating bulk campaign' },
      { status: 500 }
    );
  }
}

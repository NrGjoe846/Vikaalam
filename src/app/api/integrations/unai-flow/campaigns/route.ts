import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';
import { unaiFlowClient } from '@/lib/integrations/unai-flow/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get('orgId') || 'org_default';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const creds = await IntegrationStorage.getDecryptedCredentials(orgId, 'unai_flow', 'whatsapp_bulk');
    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        {
          success: false,
          campaigns: [],
          total: 0,
          error: 'UNAI FLOW integration is not connected. Please configure in Settings -> Integrations.',
        },
        { status: 403 }
      );
    }

    const res = await unaiFlowClient.getCampaigns(creds, page, pageSize);

    return NextResponse.json({
      success: res.success,
      campaigns: res.campaigns,
      total: res.total,
      error: res.error,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, campaigns: [], total: 0, error: err.message || 'Server error fetching campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      message_type = 'text',
      message_payload,
      messageBody, // fallback if flat messageBody provided
      mediaUrl,
      caption,
      poll,
      recipients,
      messagesPerSecond = 2.0,
      orgId = 'org_default',
    } = body;

    const payloadObj = message_payload || {
      body: messageBody || '',
      media_url: mediaUrl,
      caption: caption,
      poll: poll,
    };

    if (!recipients || !recipients.length) {
      return NextResponse.json(
        { success: false, error: 'At least one recipient is required to launch a campaign.' },
        { status: 400 }
      );
    }

    if (message_type === 'text' && !payloadObj.body) {
      return NextResponse.json(
        { success: false, error: 'Message body is required for text campaigns.' },
        { status: 400 }
      );
    }

    if ((message_type === 'image' || message_type === 'video' || message_type === 'audio') && !payloadObj.media_url) {
      return NextResponse.json(
        { success: false, error: 'A publicly accessible media URL is required for media campaigns.' },
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

    // 2. Step 1: Create campaign on UNAI FLOW (POST /v1/campaigns)
    const createRes = await unaiFlowClient.createCampaign(creds, {
      name: name || `WhatsApp Broadcast ${new Date().toLocaleDateString()}`,
      message_type,
      message_payload: payloadObj,
      recipients,
      messages_per_second: Math.max(0.1, Math.min(10.0, Number(messagesPerSecond) || 2.0)),
    });

    if (!createRes.success || !createRes.campaign) {
      return NextResponse.json(
        { success: false, error: createRes.error || 'Failed to create campaign on UNAI FLOW' },
        { status: 502 }
      );
    }

    const campaignId = createRes.campaign.id;

    // 3. Step 2: Launch campaign on UNAI FLOW (POST /v1/campaigns/{id}/launch)
    const launchRes = await unaiFlowClient.launchCampaign(creds, campaignId);
    if (!launchRes.success) {
      return NextResponse.json(
        {
          success: false,
          campaignId,
          error: launchRes.error || 'Campaign created in draft, but failed to launch on UNAI FLOW.',
        },
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
          name: name || `WhatsApp Broadcast`,
          status: launchRes.status || 'queued',
          total_recipients: recipients.length,
          queued_count: launchRes.queuedCount || recipients.length,
          messages_per_second: messagesPerSecond,
          message_payload: payloadObj,
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
        status: launchRes.status || 'queued',
        total_recipients: recipients.length,
        queued_count: launchRes.queuedCount || recipients.length,
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

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-unai-signature');
    const timestamp = req.headers.get('x-webhook-timestamp') || req.headers.get('x-unai-timestamp');
    const webhookSecret = process.env.UNAI_FLOW_WEBHOOK_SECRET;

    // Verify HMAC-SHA256 signature if webhook secret is configured and signature provided
    if (webhookSecret && signature) {
      const payloadToSign = timestamp ? `${timestamp}.${rawBody}` : rawBody;
      const expectedSign = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadToSign)
        .digest('hex');

      if (signature !== expectedSign && signature !== `sha256=${expectedSign}`) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventType = payload.event || payload.type;
    const data = payload.data || payload;

    const supabase = getSupabaseServerClient();
    if (supabase && data) {
      const campaignId = data.campaign_id || data.id;

      if (eventType === 'campaign.completed') {
        await supabase
          .from('whatsapp_campaign_jobs')
          .update({
            status: 'completed',
            delivered_count: data.delivered || data.delivered_count || 0,
            failed_count: data.failed || data.failed_count || 0,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('external_campaign_id', campaignId);
      } else if (eventType === 'message.sent' || eventType === 'message.delivered') {
        const phone = data.recipient_jid || data.phone || data.to;
        await supabase
          .from('whatsapp_messages_log')
          .insert({
            campaign_job_id: null,
            organization_id: 'org_default',
            recipient_phone: phone,
            status: 'delivered',
            delivered_at: new Date().toISOString(),
          })
          .select();
      } else if (eventType === 'message.failed') {
        const phone = data.recipient_jid || data.phone || data.to;
        await supabase
          .from('whatsapp_messages_log')
          .insert({
            campaign_job_id: null,
            organization_id: 'org_default',
            recipient_phone: phone,
            status: 'failed',
            error_message: data.error || 'Failed to deliver',
            failed_at: new Date().toISOString(),
          })
          .select();
      }
    }

    return NextResponse.json({
      received: true,
      event: eventType,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error processing webhook' },
      { status: 500 }
    );
  }
}

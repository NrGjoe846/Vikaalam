import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');
    const webhookSecret = process.env.UNAI_FLOW_WEBHOOK_SECRET;

    // Verify HMAC-SHA256 signature if webhook secret is set
    if (webhookSecret && signature && timestamp) {
      const expectedSign = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

      if (signature !== expectedSign) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    let event: any = {};
    try {
      event = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { type, data } = event;
    const supabase = getSupabaseServerClient();

    if (supabase && data) {
      if (type === 'campaign.completed' || type === 'campaign.launched') {
        const status = type === 'campaign.completed' ? 'completed' : 'sending';
        await supabase
          .from('whatsapp_campaign_jobs')
          .update({
            status,
            delivered_count: data.delivered_count,
            failed_count: data.failed_count,
            completed_at: type === 'campaign.completed' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('external_campaign_id', data.campaign_id || data.id);
      } else if (type === 'message.sent' || type === 'message.failed' || type === 'message.delivered') {
        const msgStatus = type === 'message.failed' ? 'failed' : 'delivered';
        await supabase
          .from('whatsapp_messages_log')
          .update({
            status: msgStatus,
            error_message: data.error,
            delivered_at: msgStatus === 'delivered' ? new Date().toISOString() : null,
            failed_at: msgStatus === 'failed' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('provider_message_id', data.provider_message_id || data.message_id);
      }
    }

    return NextResponse.json({ received: true, event_type: type });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Error processing webhook' },
      { status: 500 }
    );
  }
}

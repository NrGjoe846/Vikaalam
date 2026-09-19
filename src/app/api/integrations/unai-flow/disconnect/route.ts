import { NextRequest, NextResponse } from 'next/server';
import { IntegrationStorage } from '@/lib/server/integration-storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orgId = body.orgId || 'org_default';

    await IntegrationStorage.disconnectIntegration(orgId, 'unai_flow', 'whatsapp_bulk');

    return NextResponse.json({
      success: true,
      provider: 'unai_flow',
      status: 'NOT_CONNECTED',
      message: 'UNAI FLOW integration has been successfully disconnected and credentials cleared.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error disconnecting integration' },
      { status: 500 }
    );
  }
}

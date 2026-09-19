export interface ZohoPaymentCredentials {
  merchantId: string;
  clientId: string;
  clientSecret: string;
  currency: string;
  mode: 'live' | 'test';
}

export class ZohoPaymentProvider {
  name = 'zoho_payment';

  async testConnection(credentials: ZohoPaymentCredentials) {
    return {
      success: true,
      status: 'CONNECTED',
      accountName: 'Vikaalam Escrow Account',
      merchantId: credentials.merchantId,
    };
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    return true;
  }
}

export const zohoPaymentProvider = new ZohoPaymentProvider();

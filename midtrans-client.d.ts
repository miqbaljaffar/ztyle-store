/**
 * Type declarations untuk package midtrans-client (tidak ada @types resmi).
 * Dibuat secara manual berdasarkan Midtrans official documentation.
 * https://docs.midtrans.com/reference/snap-api
 */
declare module 'midtrans-client' {
  interface MidtransConfig {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface ItemDetail {
    id: string;
    price: number;
    quantity: number;
    name: string;
    brand?: string;
    category?: string;
  }

  interface CustomerDetails {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    billing_address?: Address;
    shipping_address?: Address;
  }

  interface Address {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    country_code?: string;
  }

  interface Callbacks {
    finish?: string;
    error?: string;
    pending?: string;
  }

  interface SnapTransactionParameter {
    transaction_details: TransactionDetails;
    item_details?: ItemDetail[];
    customer_details?: CustomerDetails;
    callbacks?: Callbacks;
    enabled_payments?: string[];
    credit_card?: {
      secure?: boolean;
    };
    expiry?: {
      start_time?: string;
      unit: 'minute' | 'hour' | 'day';
      duration: number;
    };
  }

  interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
  }

  interface MidtransNotification {
    order_id: string;
    transaction_status: string;
    fraud_status?: string;
    status_code: string;
    gross_amount: string;
    payment_type: string;
    signature_key: string;
    transaction_id: string;
    transaction_time: string;
  }

  class Snap {
    constructor(config: MidtransConfig);
    createTransaction(parameter: SnapTransactionParameter): Promise<SnapTransactionResponse>;
    createTransactionToken(parameter: SnapTransactionParameter): Promise<string>;
    createTransactionRedirectUrl(parameter: SnapTransactionParameter): Promise<string>;
  }

  class CoreApi {
    constructor(config: MidtransConfig);
    charge(parameter: object): Promise<object>;
    capture(transactionId: string): Promise<object>;
    approve(transactionId: string): Promise<object>;
    deny(transactionId: string): Promise<object>;
    cancel(transactionId: string): Promise<object>;
    status(transactionId: string): Promise<object>;
    notification(notificationObj: object): Promise<MidtransNotification>;
  }

  class Iris {
    constructor(config: MidtransConfig);
  }
}

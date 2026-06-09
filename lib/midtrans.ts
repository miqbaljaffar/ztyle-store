import 'server-only';
import MidtransClient from 'midtrans-client';

// Singleton Snap client (server-side only)
const snap = new MidtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
});

export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransCustomerDetail {
  first_name: string;
  email: string;
  phone?: string;
}

export interface CreateSnapTransactionParams {
  orderId: string;       // ID unik yang dikirim ke Midtrans (misal: ZTYLE-12-1718000000)
  grossAmount: number;   // Total pembayaran dalam Rupiah (integer)
  itemDetails: MidtransItemDetail[];
  customerDetails: MidtransCustomerDetail;
}

/**
 * Buat transaksi Midtrans Snap dan kembalikan token-nya.
 * Token ini dipakai frontend untuk membuka Snap popup.
 */
export async function createSnapTransaction(params: CreateSnapTransactionParams): Promise<string> {
  const { orderId, grossAmount, itemDetails, customerDetails } = params;

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: itemDetails,
    customer_details: customerDetails,
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
      error: `${process.env.NEXT_PUBLIC_APP_URL}/payment/error`,
      pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction.token;
}

export default snap;

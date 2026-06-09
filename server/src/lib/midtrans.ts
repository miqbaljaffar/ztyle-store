import MidtransClient from 'midtrans-client';

const snap = new MidtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
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
  orderId: string;       
  grossAmount: number;   
  itemDetails: MidtransItemDetail[];
  customerDetails: MidtransCustomerDetail;
}

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
      finish: `${process.env.FRONTEND_URL}/payment/success`,
      error: `${process.env.FRONTEND_URL}/payment/error`,
      pending: `${process.env.FRONTEND_URL}/payment/pending`,
    },
  };

  const transaction = await snap.createTransaction(parameter);
  return transaction.token;
}

export default snap;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSnapTransaction = createSnapTransaction;
const midtrans_client_1 = __importDefault(require("midtrans-client"));
const snap = new midtrans_client_1.default.Snap({
    isProduction: process.env.NODE_ENV === 'production',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});
async function createSnapTransaction(params) {
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
exports.default = snap;

declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';
declare module '*.styl';

// Deklarasi tipe untuk Midtrans Snap.js (diload via CDN di browser)
interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

interface SnapResult {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

interface Snap {
  pay: (snapToken: string, callbacks?: SnapCallbacks) => void;
  hide: () => void;
}

interface Window {
  snap: Snap;
}

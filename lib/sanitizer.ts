import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Inisialisasi DOMPurify dengan JSDOM untuk lingkungan server-side (Next.js API)
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Membersihkan input string untuk mencegah XSS.
 * @param dirty - String input yang mungkin mengandung kode berbahaya.
 * @returns String yang sudah dibersihkan.
 */
export const sanitizeInput = (dirty: string | null | undefined): string => {
  if (dirty === null || dirty === undefined) {
    return '';
  }
  return purify.sanitize(dirty);
};

/**
 * Membersihkan semua nilai string dalam sebuah objek.
 * @param obj - Objek yang akan dibersihkan.
 * @returns Objek dengan semua nilai string yang telah dibersihkan.
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitizedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitizedObj[key] = sanitizeInput(value) as any;
      } else {
        sanitizedObj[key] = value;
      }
    }
  }
  return sanitizedObj;
};
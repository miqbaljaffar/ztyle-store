import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export const sanitizeInput = (dirty: string | null | undefined): string => {
  if (dirty === null || dirty === undefined) {
    return '';
  }
  return purify.sanitize(dirty);
};

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

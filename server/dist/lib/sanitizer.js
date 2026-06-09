"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeObject = exports.sanitizeInput = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
const sanitizeInput = (dirty) => {
    if (dirty === null || dirty === undefined) {
        return '';
    }
    return purify.sanitize(dirty);
};
exports.sanitizeInput = sanitizeInput;
const sanitizeObject = (obj) => {
    const sanitizedObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                sanitizedObj[key] = (0, exports.sanitizeInput)(value);
            }
            else {
                sanitizedObj[key] = value;
            }
        }
    }
    return sanitizedObj;
};
exports.sanitizeObject = sanitizeObject;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
async function sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
        from: '"Ztyle App" <no-reply@ztyle.com>',
        to: email,
        subject: 'Verifikasi Alamat Email Anda',
        html: `
      <h1>Verifikasi Email Anda</h1>
      <p>Terima kasih telah mendaftar. Silakan klik link di bawah ini atau gunakan kode OTP untuk memverifikasi alamat email Anda.</p>
      <p><strong>Kode OTP Anda: ${token}</strong></p>
      <p><a href="${verificationUrl}">Klik di sini untuk verifikasi</a></p>
      <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
    `,
    });
}
async function sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await transporter.sendMail({
        from: '"Ztyle App" <no-reply@ztyle.com>',
        to: email,
        subject: 'Instruksi Reset Password Anda',
        html: `
      <h1>Reset Password</h1>
      <p>Anda menerima email ini karena ada permintaan untuk mereset password akun Anda. Silakan gunakan kode di bawah ini atau klik tautan untuk melanjutkan.</p>
      <p><strong>Kode OTP Anda: ${token}</strong></p>
      <p><a href="${resetUrl}">Klik di sini untuk reset password</a></p>
      <p>Jika Anda tidak merasa meminta ini, abaikan saja email ini. Link akan kedaluwarsa dalam 1 jam.</p>
    `,
    });
}

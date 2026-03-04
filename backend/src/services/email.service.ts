import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465, // true for 465 (SSL), false for 587 (TLS/STARTTLS)
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
    connectionTimeout: 15000, // 15 seconds
    greetingTimeout: 15000,
    socketTimeout: 20000,
});

export const sendOTP = async (to: string, otp: string) => {
    logger.debug(`SMTP Config: host=${env.EMAIL_HOST}, port=${env.EMAIL_PORT}, user=${env.EMAIL_USER}, secure=${env.EMAIL_PORT === 465}`);
    try {
        const info = await transporter.sendMail({
            from: `"Support" <${env.EMAIL_FROM}>`,
            to,
            subject: 'Your OTP Code',
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
            html: `<b>Your OTP is ${otp}</b><br>It will expire in 10 minutes.`,
        });
        logger.info(`Message sent: ${info.messageId}`);
    } catch (error: any) {
        logger.error('Error sending OTP email:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
        // Throw the specific error message to help identify if it's AUTH, TIMEOUT, or something else
        throw new Error(error.message || 'Unknown SMTP error');
    }
};

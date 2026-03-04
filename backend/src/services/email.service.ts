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
            stack: error.stack,
            code: error.code,
            command: error.command
        });
        throw new Error('Failed to send OTP email');
    }
};

import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
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

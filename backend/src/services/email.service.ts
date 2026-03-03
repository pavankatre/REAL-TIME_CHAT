import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
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
    } catch (error) {
        logger.error('Error sending OTP email', error);
        throw new Error('Failed to send OTP email');
    }
};

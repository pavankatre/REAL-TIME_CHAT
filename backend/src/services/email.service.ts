import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
});

export const sendOTP = async (to: string, otp: string) => {
    // Phase 4: Use Resend REST API if key is available (Recommended for Render)
    if (env.RESEND_API_KEY) {
        logger.info('Using Resend API for email delivery');
        try {
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: env.EMAIL_FROM,
                    to: [to],
                    subject: 'Your OTP Code',
                    html: `<b>Your OTP is ${otp}</b><br>It will expire in 10 minutes.`,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Resend API Error: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            logger.info(`Email sent via Resend: ${data.id}`);
            return;
        } catch (error: any) {
            logger.error('Resend API failure:', error);
            throw new Error(`Failed to send email via Resend: ${error.message}`);
        }
    }

    // Fallback: Use SMTP (Will timeout on Render)
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
        throw new Error(error.message || 'Unknown SMTP error');
    }
};

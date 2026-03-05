import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const getOTPTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #4f46e5; }
        .header h1 { color: #4f46e5; margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; text-align: center; }
        .otp-box { background-color: #f3f4f6; padding: 15px; border-radius: 8px; display: inline-block; margin: 20px 0; border: 1px dashed #4f46e5; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; }
        .footer { text-align: center; padding-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e0e0e0; }
        .expiry { color: #ef4444; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Real Time Chat</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email</h2>
            <p>Thank you for joining <strong>Real Time Chat</strong>. Use the following code to complete your registration:</p>
            <div class="otp-box">
                <span class="otp-code">${otp}</span>
            </div>
            <p class="expiry">This code will expire in 5 minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Real Time Chat. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

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
    console.log('--- SendOTP Execution Check ---');
    console.log('RESEND_API_KEY available in env object:', !!env.RESEND_API_KEY);
    console.log('fetch is available:', typeof fetch !== 'undefined');
    console.log('------------------------------');

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
                    subject: 'Verify your Real Time Chat account',
                    html: getOTPTemplate(otp),
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

    // Phase 5: Use SendGrid REST API if key is available (Supports Single Sender Verification)
    if (env.SENDGRID_API_KEY) {
        logger.info('Using SendGrid API for email delivery');
        try {
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: to }] }],
                    from: { email: env.EMAIL_FROM },
                    subject: 'Verify your Real Time Chat account',
                    content: [{
                        type: 'text/html',
                        value: getOTPTemplate(otp)
                    }]
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`SendGrid API Error: ${JSON.stringify(errorData)}`);
            }

            logger.info('Email sent via SendGrid');
            return;
        } catch (error: any) {
            logger.error('SendGrid API failure:', error);
            throw new Error(`Failed to send email via SendGrid: ${error.message}`);
        }
    }

    // Fallback: Use SMTP (Will timeout on Render)
    logger.debug(`SMTP Config: host=${env.EMAIL_HOST}, port=${env.EMAIL_PORT}, user=${env.EMAIL_USER}, secure=${env.EMAIL_PORT === 465}`);
    try {
        const info = await transporter.sendMail({
            from: `"Real Time Chat" <${env.EMAIL_FROM}>`,
            to,
            subject: 'Verify your Real Time Chat account',
            text: `Your Real Time Chat OTP is ${otp}. It will expire in 5 minutes.`,
            html: getOTPTemplate(otp),
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

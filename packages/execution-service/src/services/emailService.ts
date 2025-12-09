/**
 * Email Service
 * Ported from C# EmailService
 * Uses nodemailer for sending emails via SMTP
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailMessage {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    text?: string;
    html?: string;
    emailFormat?: 'text' | 'html' | 'both';
    body?: string; // Legacy support
    isHtml?: boolean; // Legacy support
    attachments?: EmailAttachment[];
}

export interface EmailAttachment {
    fileName: string;
    contentType: string;
    content: Buffer;
}

export interface EmailCredentials {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail?: string;
    fromName?: string;
    enableSsl?: boolean;
}

export interface EmailSendResult {
    success: boolean;
    message?: string;
    messageId?: string;
    errorDetails?: string;
}

export class EmailService {
    private logger?: Console;

    constructor(logger?: Console) {
        this.logger = logger || console;
    }

    /**
     * Send email via SMTP
     */
    async sendEmail(message: EmailMessage, credentials: EmailCredentials | null): Promise<EmailSendResult> {
        if (!credentials) {
            this.logger?.error('❌ Email SMTP credentials not provided');
            return {
                success: false,
                message: 'Email service not configured',
                errorDetails: 'SMTP credentials are missing. Please configure SMTP secrets or direct fields in the Email Node configuration.'
            };
        }

        const smtpHost = credentials.smtpHost;
        const smtpPort = credentials.smtpPort ?? 587;
        const smtpUsername = credentials.smtpUsername;
        const smtpPassword = credentials.smtpPassword;
        const fromEmail = credentials.fromEmail || message.to; // Fallback to recipient if not set
        const fromName = credentials.fromName || 'Agent Builder';
        const enableSsl = credentials.enableSsl !== false;

        if (!smtpUsername || !smtpPassword) {
            this.logger?.error('❌ Email SMTP credentials not configured');
            return {
                success: false,
                message: 'Email service not configured',
                errorDetails: 'SMTP credentials are missing. Please configure SMTP secrets in the Email Node configuration.'
            };
        }

        try {
            this.logger?.log(`📧 Sending email to: ${message.to}, Subject: ${message.subject}`);

            // Create transporter
            const transporter: Transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: enableSsl && smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: smtpUsername,
                    pass: smtpPassword,
                },
            });

            // Handle email format: text, html, or both
            const emailFormat = message.emailFormat || 'html';
            let textBody: string | undefined;
            let htmlBody: string | undefined;

            if (emailFormat === 'text' || emailFormat === 'both') {
                textBody = message.text || message.body || '';
            }

            if (emailFormat === 'html' || emailFormat === 'both') {
                htmlBody = message.html || message.body || '';
            }

            // Legacy support: if Body is set but Text/Html are not, use Body
            if (!textBody && !htmlBody && message.body) {
                if (message.isHtml) {
                    htmlBody = message.body;
                } else {
                    textBody = message.body;
                }
            }

            // Build mail options
            const mailOptions: any = {
                from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
                to: message.to.split(/[;,]/).map((e: string) => e.trim()).filter((e: string) => e),
                subject: message.subject,
            };

            if (emailFormat === 'both') {
                // For "both", set both text and html
                mailOptions.text = textBody;
                mailOptions.html = htmlBody;
            } else if (emailFormat === 'text') {
                mailOptions.text = textBody;
            } else {
                mailOptions.html = htmlBody;
            }

            // Add CC
            if (message.cc) {
                mailOptions.cc = message.cc.split(/[;,]/).map((e: string) => e.trim()).filter((e: string) => e);
            }

            // Add BCC
            if (message.bcc) {
                mailOptions.bcc = message.bcc.split(/[;,]/).map((e: string) => e.trim()).filter((e: string) => e);
            }

            // Add attachments
            if (message.attachments && message.attachments.length > 0) {
                mailOptions.attachments = message.attachments.map((att) => ({
                    filename: att.fileName,
                    contentType: att.contentType,
                    content: att.content,
                }));
            }

            // Send email
            const info = await transporter.sendMail(mailOptions);

            const messageId = info.messageId || `msg_${Date.now()}`;
            this.logger?.log(`✅ Email sent successfully to ${message.to} (ID: ${messageId})`);

            return {
                success: true,
                message: `Email sent successfully to ${message.to}`,
                messageId,
            };
        } catch (error: any) {
            this.logger?.error(`❌ Error sending email: ${error.message}`, error);
            return {
                success: false,
                message: 'Failed to send email',
                errorDetails: error.message || 'Unknown error',
            };
        }
    }
}

// Export singleton instance
export const emailService = new EmailService();



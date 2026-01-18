import type { FunctionHandler } from '../index';
import { emailService } from '../../services/emailService';
import { emailCredentialsService } from '../../services/emailCredentialsService';

/**
 * Find SMTP profile secret by name pattern
 */
function findSmtpProfileSecret(secrets: Record<string, string>): string | null {
    const smtpProfilePatterns = [
        /^smtp_/i,
        /^email_smtp_/i,
        /_smtp_profile$/i,
    ];

    for (const [key, value] of Object.entries(secrets)) {
        if (smtpProfilePatterns.some(pattern => pattern.test(key))) {
            try {
                const parsed = typeof value === 'string' ? JSON.parse(value) : value;
                if (parsed && typeof parsed === 'object' && parsed.host && parsed.username && parsed.password) {
                    return key;
                }
            } catch {
                // Not a JSON profile, continue
            }
        }
    }
    return null;
}

/**
 * Find secret name by multiple possible name patterns
 */
function findSecretNameByPattern(secrets: Record<string, string>, patterns: string[]): string | null {
    for (const pattern of patterns) {
        if (secrets[pattern]) {
            return pattern;
        }
        const lowerPattern = pattern.toLowerCase();
        for (const key of Object.keys(secrets)) {
            if (key.toLowerCase() === lowerPattern) {
                return key;
            }
        }
    }
    return null;
}

export const emailFunctionHandler: FunctionHandler = {
    name: 'send_email_smtp',
    description: 'Send an email via SMTP. Use this when the user asks to send an email, notify someone, or send a message via email. Requires SMTP credentials configured as secrets (e.g., "smtp_gmail" profile or individual SMTP secrets).',
    parameters: {
        type: 'object',
        properties: {
            to: {
                type: 'string',
                description: 'Email address of the recipient (required)',
            },
            subject: {
                type: 'string',
                description: 'Email subject line (required)',
            },
            text: {
                type: 'string',
                description: 'Plain text email body (required if html is not provided)',
            },
            html: {
                type: 'string',
                description: 'HTML email body (required if text is not provided)',
            },
            cc: {
                type: 'string',
                description: 'Comma-separated list of CC recipients',
            },
            bcc: {
                type: 'string',
                description: 'Comma-separated list of BCC recipients',
            },
            fromEmail: {
                type: 'string',
                description: 'Sender email address (optional, uses SMTP profile default if not provided)',
            },
            fromName: {
                type: 'string',
                description: 'Sender name (optional)',
            },
            emailFormat: {
                type: 'string',
                enum: ['text', 'html', 'both'],
                description: 'Email format: text (plain text), html (HTML), or both (multipart). Defaults to "html".',
                default: 'html',
            },
        },
        required: ['to', 'subject'],
        additionalProperties: false,
    },
    metadata: {
        requiredSecrets: ['smtp_profile'],
        docsUrl: 'https://github.com/your-repo/docs/email-function',
        setupInstructions: '1. Create an SMTP profile secret (e.g., "smtp_gmail") in the secrets management\n2. The secret should contain JSON with: host, port, username, password, enableSsl\n3. Example: {"host": "smtp.gmail.com", "port": 587, "username": "user@gmail.com", "password": "app-password", "enableSsl": true}',
    },
    async execute(args, context) {
        const {
            to,
            subject,
            text,
            html,
            cc,
            bcc,
            fromEmail,
            fromName,
            emailFormat = 'html',
        } = args;

        // Validate required fields
        if (!to) {
            throw new Error('Email "to" field is required');
        }
        if (!subject) {
            throw new Error('Email "subject" field is required');
        }
        if (emailFormat === 'text' && !text) {
            throw new Error('Email "text" field is required when emailFormat is "text"');
        }
        if (emailFormat === 'html' && !html) {
            throw new Error('Email "html" field is required when emailFormat is "html"');
        }
        if (emailFormat === 'both') {
            if (!text && !html) {
                throw new Error('Email requires either "text" or "html" field when emailFormat is "both"');
            }
        }

        // Build SMTP credentials from secrets using EmailCredentialsService
        const smtpProfileSecretName = findSmtpProfileSecret(context.secrets);
        
        // Find individual secret names (for legacy support)
        const smtpHostSecretName = findSecretNameByPattern(context.secrets, ['smtp_host', 'smtpHost', 'smtp_host_secret']);
        const smtpUsernameSecretName = findSecretNameByPattern(context.secrets, ['smtp_username', 'smtpUsername', 'smtp_username_secret']);
        const smtpPasswordSecretName = findSecretNameByPattern(context.secrets, ['smtp_password', 'smtpPassword', 'smtp_password_secret']);

        const credentials = emailCredentialsService.buildCredentials(context.secrets, {
            smtpProfileSecretName: smtpProfileSecretName || undefined,
            smtpHostSecretName: smtpHostSecretName || undefined,
            smtpUsernameSecretName: smtpUsernameSecretName || undefined,
            smtpPasswordSecretName: smtpPasswordSecretName || undefined,
            fromEmail: fromEmail,
            fromName: fromName,
        });

        if (!credentials) {
            throw new Error('SMTP credentials are required. Please configure an SMTP profile secret (e.g., "smtp_gmail") or individual SMTP secrets in the secrets management.');
        }

        // Build email message
        const emailMessage = {
            to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject,
            text: text || undefined,
            html: html || undefined,
            emailFormat: emailFormat as 'text' | 'html' | 'both',
        };

        try {
            console.log(`[Email Function] Sending email via TypeScript EmailService to: ${to}, Subject: ${subject}`);

            const result = await emailService.sendEmail(emailMessage, credentials);

            if (result.success) {
                return {
                    success: true,
                    messageId: result.messageId,
                    message: result.message || 'Email sent successfully',
                    to,
                    subject,
                };
            } else {
                throw new Error(result.message || 'Email sending failed');
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Email sending failed';
            console.error('[Email Function] Error:', errorMessage);
            throw new Error(`Failed to send email: ${errorMessage}`);
        }
    },
};


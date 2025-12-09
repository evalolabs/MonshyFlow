import { z } from 'zod';
import type { McpConnection, McpHandler, McpHandlerContext, McpTool } from '..';
import { emailService } from '../../services/emailService';
import { emailCredentialsService } from '../../services/emailCredentialsService';

/**
 * Email MCP Connection
 * Provides email sending capabilities to AI agents
 * The agent can decide when to send emails based on context
 */
class EmailMcpConnection implements McpConnection {
    private readonly tenantId?: string;
    private readonly secrets: Record<string, string>;

    constructor(secrets: Record<string, string>, tenantId?: string) {
        this.secrets = secrets;
        this.tenantId = tenantId;
    }

    /**
     * Defines the tools that this handler exposes to the agent.
     */
    async listTools(): Promise<McpTool[]> {
        return [
            {
                name: 'sendEmail',
                description: 'Send an email via SMTP. Use this when the user asks to send an email, notify someone, or send a message via email. The agent should determine the recipient, subject, and content based on the conversation context.',
                parameters: z.object({
                    to: z.string().describe('Email address of the recipient (required)'),
                    subject: z.string().describe('Email subject line (required)'),
                    text: z.string().optional().describe('Plain text email body (required if html is not provided)'),
                    html: z.string().optional().describe('HTML email body (required if text is not provided)'),
                    cc: z.string().optional().describe('Comma-separated list of CC recipients'),
                    bcc: z.string().optional().describe('Comma-separated list of BCC recipients'),
                    fromEmail: z.string().optional().describe('Sender email address (optional, uses SMTP profile default if not provided)'),
                    fromName: z.string().optional().describe('Sender name (optional)'),
                    emailFormat: z.enum(['text', 'html', 'both']).optional().default('html').describe('Email format: text (plain text), html (HTML), or both (multipart)'),
                }),
            },
        ];
    }

    /**
     * Executes the requested tool using TypeScript EmailService (no C# API call).
     */
    async invoke(toolName: string, args: Record<string, any>): Promise<any> {
        switch (toolName) {
            case 'sendEmail':
                return this.sendEmail(args);
            default:
                throw new Error(`Tool "${toolName}" is not supported by the Email handler.`);
        }
    }

    /**
     * Send email via TypeScript EmailService (no C# API call)
     */
    private async sendEmail(args: Record<string, any>): Promise<any> {
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
        const smtpProfileSecretName = this.findSmtpProfileSecret();
        
        // Find individual secret names (for legacy support)
        const smtpHostSecretName = this.findSecretNameByPattern(['smtp_host', 'smtpHost', 'smtp_host_secret']);
        const smtpUsernameSecretName = this.findSecretNameByPattern(['smtp_username', 'smtpUsername', 'smtp_username_secret']);
        const smtpPasswordSecretName = this.findSecretNameByPattern(['smtp_password', 'smtpPassword', 'smtp_password_secret']);

        const credentials = emailCredentialsService.buildCredentials(this.secrets, {
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
            console.log(`[Email MCP] Sending email via TypeScript EmailService to: ${to}, Subject: ${subject}`);

            // Send email using TypeScript EmailService (no C# API call)
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
            console.error('[Email MCP] Error:', errorMessage);
            throw new Error(`Failed to send email: ${errorMessage}`);
        }
    }

    /**
     * Find SMTP profile secret by name pattern
     */
    private findSmtpProfileSecret(): string | null {
        // Look for secrets that look like SMTP profiles
        const smtpProfilePatterns = [
            /^smtp_/i,
            /^email_smtp_/i,
            /_smtp_profile$/i,
        ];

        for (const [key, value] of Object.entries(this.secrets)) {
            // Check if key matches SMTP profile pattern
            if (smtpProfilePatterns.some(pattern => pattern.test(key))) {
                // Try to parse as JSON to verify it's a profile
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
     * Find secret name by multiple possible name patterns (returns the key, not the value)
     */
    private findSecretNameByPattern(patterns: string[]): string | null {
        for (const pattern of patterns) {
            // Exact match
            if (this.secrets[pattern]) {
                return pattern;
            }

            // Case-insensitive match
            const lowerPattern = pattern.toLowerCase();
            for (const key of Object.keys(this.secrets)) {
                if (key.toLowerCase() === lowerPattern) {
                    return key;
                }
            }
        }

        return null;
    }
}

/**
 * Email MCP Handler
 * Allows AI agents to send emails via SMTP
 */
export const emailMcpHandler: McpHandler = {
    id: 'email',
    name: 'Email (SMTP)',
    description: 'Send emails via SMTP. The agent can decide when to send emails based on user requests or conversation context.',
    metadata: {
        requiredSecrets: ['smtp_profile'], // Optional - can use any SMTP profile secret
        docsUrl: 'https://github.com/your-repo/docs/email-mcp',
        setupInstructions: '1. Create an SMTP profile secret (e.g., "smtp_gmail") in the secrets management\n2. The secret should contain JSON with: host, port, username, password, enableSsl\n3. Example: {"host": "smtp.gmail.com", "port": 587, "username": "user@gmail.com", "password": "app-password", "enableSsl": true}',
    },
    async connect(config: any, context: McpHandlerContext): Promise<McpConnection> {
        // Email MCP doesn't require a specific secret - it will try to find SMTP profiles automatically
        // But we can check if at least one SMTP-related secret exists
        const hasSmtpSecret = Object.keys(context.secrets).some(key => 
            key.toLowerCase().includes('smtp') || 
            key.toLowerCase().includes('email')
        );

        if (!hasSmtpSecret) {
            console.warn('[Email MCP] No SMTP secrets found. Email sending may fail. Please create an SMTP profile secret.');
        }

        return new EmailMcpConnection(context.secrets, context.workflow?.tenantId);
    },
};


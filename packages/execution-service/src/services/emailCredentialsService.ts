/**
 * Email Credentials Service
 * Ported from C# EmailCredentialsService
 * Builds EmailCredentials from SMTP profile secrets or legacy individual secrets
 */

import type { EmailCredentials } from './emailService';

export class EmailCredentialsService {
    private logger?: Console;

    constructor(logger?: Console) {
        this.logger = logger || console;
    }

    /**
     * Build EmailCredentials from SMTP profile secret or legacy individual secrets
     */
    buildCredentials(
        secrets: Record<string, string>,
        options: {
            smtpProfileSecretName?: string;
            smtpHostSecretName?: string;
            smtpUsernameSecretName?: string;
            smtpPasswordSecretName?: string;
            fromNameSecretName?: string;
            smtpHost?: string;
            smtpUsername?: string;
            smtpPassword?: string;
            smtpPort?: number;
            fromEmail?: string;
            fromName?: string;
        }
    ): EmailCredentials | null {
        // 1. Try SMTP Profile Secret (recommended)
        if (options.smtpProfileSecretName) {
            const profileValue = this.getSecretValue(secrets, options.smtpProfileSecretName);
            if (profileValue) {
                const credentials = this.buildCredentialsFromProfile(
                    options.smtpProfileSecretName,
                    profileValue,
                    options.fromEmail
                );
                if (credentials) {
                    this.logger?.log(`✅ SMTP credentials loaded from profile '${options.smtpProfileSecretName}'`);
                    return credentials;
                }
            }
        }

        // 2. Fallback to legacy individual secrets or direct fields
        const resolvedSmtpHost = this.getSecretValue(secrets, options.smtpHostSecretName) || options.smtpHost;
        const resolvedSmtpUsername = this.getSecretValue(secrets, options.smtpUsernameSecretName) || options.smtpUsername;
        const resolvedSmtpPassword = this.getSecretValue(secrets, options.smtpPasswordSecretName) || options.smtpPassword;
        const resolvedFromName = this.getSecretValue(secrets, options.fromNameSecretName) || options.fromName;

        if (resolvedSmtpHost && resolvedSmtpUsername && resolvedSmtpPassword) {
            const credentials: EmailCredentials = {
                smtpHost: resolvedSmtpHost,
                smtpPort: options.smtpPort ?? 587,
                smtpUsername: resolvedSmtpUsername,
                smtpPassword: resolvedSmtpPassword,
                fromEmail: options.fromEmail || resolvedSmtpUsername,
                fromName: resolvedFromName,
                enableSsl: true,
            };
            this.logger?.log('✅ SMTP credentials loaded from legacy secrets or direct fields');
            return credentials;
        }

        return null;
    }

    /**
     * Get secret value from context by name (with case-insensitive fallback)
     */
    private getSecretValue(secrets: Record<string, string>, secretName?: string): string | null {
        if (!secretName) {
            return null;
        }

        // Try exact match first
        if (secrets[secretName]) {
            return secrets[secretName];
        }

        // Try case-insensitive lookup
        const matchingKey = Object.keys(secrets).find(
            (key) => key.toLowerCase() === secretName.toLowerCase()
        );
        if (matchingKey) {
            return secrets[matchingKey];
        }

        return null;
    }

    /**
     * Build credentials from SMTP profile JSON
     */
    private buildCredentialsFromProfile(
        profileName: string,
        profileJson: string,
        fromEmail?: string
    ): EmailCredentials | null {
        if (!profileJson || profileJson.trim() === '') {
            this.logger?.warn(`SMTP profile secret ${profileName} is empty`);
            return null;
        }

        try {
            const profile = JSON.parse(profileJson);

            if (!profile.host || typeof profile.host !== 'string' || profile.host.trim() === '') {
                this.logger?.warn(`SMTP profile ${profileName} is missing host`);
                return null;
            }

            if (!profile.username || typeof profile.username !== 'string' || profile.username.trim() === '') {
                this.logger?.warn(`SMTP profile ${profileName} is missing username`);
                return null;
            }

            if (!profile.password || typeof profile.password !== 'string' || profile.password.trim() === '') {
                this.logger?.warn(`SMTP profile ${profileName} is missing password`);
                return null;
            }

            const host = profile.host.trim();
            const username = profile.username.trim();
            const password = profile.password.trim();
            const port = profile.port || 587;
            const profileFromEmail = profile.fromEmail || null;
            const profileFromName = profile.fromName || null;
            const enableSsl = profile.enableSsl !== false;

            const effectiveFromEmail = fromEmail || profileFromEmail || username;

            return {
                smtpHost: host,
                smtpPort: port,
                smtpUsername: username,
                smtpPassword: password,
                fromEmail: effectiveFromEmail,
                fromName: profileFromName,
                enableSsl,
            };
        } catch (error: any) {
            this.logger?.error(`Failed to parse SMTP profile secret ${profileName}: ${error.message}`);
            return null;
        }
    }
}

// Export singleton instance
export const emailCredentialsService = new EmailCredentialsService();



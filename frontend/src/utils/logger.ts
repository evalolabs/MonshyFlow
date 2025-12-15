/**
 * Logger Utility
 * 
 * Provides structured logging with different levels and ability to disable in production.
 * Use this instead of console.log throughout the application.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: import.meta.env.DEV || false, // Only enabled in development by default
      minLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info',
      prefix: config.prefix,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const emoji = this.getEmoji(level);
    return `${emoji} ${prefix} ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '🐛';
      case 'info':
        return 'ℹ️';
      case 'warn':
        return '⚠️';
      case 'error':
        return '💥';
      default:
        return '';
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }
}

export const logger = new Logger();
export const workflowLogger = new Logger({ prefix: 'Workflow' });
export const nodeLogger = new Logger({ prefix: 'Node' });
export const edgeLogger = new Logger({ prefix: 'Edge' });
export const autoSaveLogger = new Logger({ prefix: 'AutoSave' });
export const layoutLogger = new Logger({ prefix: 'Layout' });
export const undoRedoLogger = new Logger({ prefix: 'UndoRedo' });

export { Logger };
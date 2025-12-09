// Simple logger utility (can be replaced with Pino later)
export const logger = {
  info: (message: string, ...args: any[]) => console.log(`[DB] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[DB] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[DB] ${message}`, ...args),
  debug: (message: string, ...args: any[]) => console.debug(`[DB] ${message}`, ...args),
};


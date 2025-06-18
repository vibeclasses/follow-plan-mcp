/**
 * Simple logging utility for the Follow Plan MCP server
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private level: LogLevel = "info";

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    meta?: unknown
  ): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (meta) {
      return `${prefix} ${message} ${JSON.stringify(meta, null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  debug(message: string, meta?: unknown): void {
    if (this.shouldLog("debug")) {
      console.log(this.formatMessage("debug", message, meta));
    }
  }

  info(message: string, meta?: unknown): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, meta));
    }
  }

  warn(message: string, meta?: unknown): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, meta));
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog("error")) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;

      console.error(
        this.formatMessage("error", message, { error: errorMessage, stack })
      );
    }
  }
}

export const logger = new Logger();

import { IS_PRODUCTION, IS_TEST } from "./env";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

const getLevelNumber = (level: LogLevel) => LOG_LEVELS.indexOf(level);

export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogLevelSetting = LogLevel | "silent";

export const validateLogLevel = (level: LogLevelSetting) => {
  if (level === "silent") return;
  if (!LOG_LEVELS.includes(level)) {
    throw new Error(
      `Invalid log level: "${level}". Accepted values: ${LOG_LEVELS.join(", ")}`,
    );
  }
};

export type LogMetadata = Record<string, unknown>;

export interface Log<
  Message extends string | Error = string,
  Metadata extends LogMetadata = LogMetadata,
> {
  message: Message;
  level: LogLevel;
  metadata: Metadata;
  time: Date;
}

export type Logger = {
  name: string;

  log<
    Message extends string | Error = string,
    Metadata extends LogMetadata = LogMetadata,
  >(
    message: Message,
    level: LogLevel,
    metadata?: Metadata,
  ): Log<Message, Metadata>;

  logOutput(
    chunk: Uint8Array,
    level: LogLevel,
    stream: NodeJS.WriteStream,
    prefix: string,
  ): Log<string, Record<string, unknown>>;

  printLevel: LogLevelSetting;
} & {
  [Level in LogLevel]: <
    Message extends string | Error = string,
    Metadata extends LogMetadata = LogMetadata,
  >(
    message: Message,
    metadata?: Metadata,
  ) => Log<Message, Metadata>;
};

export const createLogger = (name: string): Logger => new _Logger(name);

class _Logger implements Logger {
  constructor(public name: string) {}

  log<
    Message extends string | Error = string,
    Metadata extends LogMetadata = LogMetadata,
  >(
    message: Message,
    level: LogLevel,
    metadata?: Metadata,
  ): Log<Message, Metadata> {
    const log: Log<Message, Metadata> = {
      message,
      level,
      metadata: metadata ?? ({} as Metadata),
      time: new Date(),
    };

    if (this.shouldPrint(level)) {
      const formattedMessage = this.formatLogMessage(message, level);
      if (message instanceof Error) {
        message.message = formattedMessage;
      }
      // eslint-disable-next-line no-console
      console[level](
        message instanceof Error ? message : formattedMessage,
        ...(metadata ? [{ metadata }] : []),
      );
    }

    return log;
  }

  logOutput(
    chunk: Uint8Array,
    level: LogLevel,
    stream: NodeJS.WriteStream,
    prefix: string,
  ) {
    const message = new TextDecoder().decode(chunk).trim();

    const log: Log<string, Record<string, unknown>> = {
      message,
      level,
      metadata: { stream, isLogOutput: true },
      time: new Date(),
    };

    if (!this.shouldPrint(level)) {
      return log;
    }

    const linePrefix = `${prefix}\x1b[0m`;
    const lines = message.split(/\r?\n/);
    lines.forEach((line) => {
      if (line) stream.write(linePrefix + line + "\n");
    });

    return log;
  }

  debug<
    Message extends string | Error = string,
    Metadata extends LogMetadata = LogMetadata,
  >(message: Message, metadata?: Metadata): Log<Message, Metadata> {
    return this.log(message, "debug", metadata);
  }

  info<
    Message extends string | Error = string,
    Metadata extends LogMetadata = LogMetadata,
  >(message: Message, metadata?: Metadata): Log<Message, Metadata> {
    return this.log(message, "info", metadata);
  }

  warn<
    Message extends string | Error = string,
    Metadata extends LogMetadata = LogMetadata,
  >(message: Message, metadata?: Metadata): Log<Message, Metadata> {
    return this.log(message, "warn", metadata);
  }

  error<
    Message extends string | Error = string,
    Metadata extends LogMetadata = LogMetadata,
  >(message: Message, metadata?: Metadata): Log<Message, Metadata> {
    return this.log(message, "error", metadata);
  }

  get printLevel() {
    return this._printLevel;
  }

  set printLevel(level: LogLevelSetting) {
    this._printLevel = level;
  }

  // Info prints normally for standard user-facing logs. Debug and Warn are highlighted with a prefix. Errors print as Error instances
  private formatLogMessage(message: Error | string, level: LogLevel): string {
    const content = message instanceof Error ? message.message : message;
    return level === "debug" || level === "warn"
      ? `[${this.name} ${level.toUpperCase()}]: ${content}`
      : content;
  }

  private _printLevel: LogLevelSetting = IS_PRODUCTION
    ? "info"
    : IS_TEST
      ? "silent"
      : "debug";

  private shouldPrint(level: LogLevel): boolean {
    if (this.printLevel === "silent") return false;
    return getLevelNumber(level) >= getLevelNumber(this.printLevel);
  }
}

export const logger = createLogger("bun-workspaces");

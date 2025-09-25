import { IS_PRODUCTION } from "./env";

export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

const getLevelNumber = (level: LogLevel) => LOG_LEVELS.indexOf(level);

export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogLevelSetting = LogLevel | "silent";

export type LogMetadata = Record<string, any>;

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
      console[level](
        getLevelNumber(level) >= getLevelNumber("warn") &&
          !(message instanceof Error)
          ? new Error(formattedMessage)
          : formattedMessage,
        ...(metadata ? [{ metadata }] : []),
      );
    }

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

  private formatLogMessage(message: Error | string, level: LogLevel): string {
    return `[${this.name} ${level.toUpperCase()}]: ${
      message instanceof Error ? message.message : message
    }`;
  }

  private _printLevel: LogLevelSetting = IS_PRODUCTION ? "warn" : "debug";

  private shouldPrint(level: LogLevel): boolean {
    if (this.printLevel === "silent") return false;
    return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(this.printLevel);
  }
}

export const logger = createLogger("bw");

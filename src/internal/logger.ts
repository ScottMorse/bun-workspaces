import createPinoLogger from "pino";

export const logger = createPinoLogger({
  msgPrefix: `[bw] `,
  level:
    process.env.NODE_ENV === "test"
      ? "silent"
      : process.env.NODE_ENV === "development"
        ? "debug"
        : "info",
  transport: {
    target: "pino-pretty",
    options: {
      color: true,
      ignore: "hostname,pid,time",
    },
  },
});

export const createLogger = (prefixContent = "bun-workspaces") =>
  logger.child({}, { msgPrefix: `[${prefixContent}] ` });

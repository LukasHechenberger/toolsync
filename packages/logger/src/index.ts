import pino from 'pino';
import pinoPretty from 'pino-pretty';
import setupDebug, { type Debugger } from 'debug';

const envDebug = process.env.DEBUG;
const envLogLevel = process.env.LOG_LEVEL || 'info';

const pretty = pinoPretty({
  ignore: 'pid,hostname,ns,time',
  // Customize the log message format
  messageFormat(log, messageKey, _, { colors }) {
    return colors.reset(`${log[messageKey]} ${colors.reset(colors.dim(`[${log.ns}]`))}`);
  },
  sync: true,
});
const rootLogger = pino({ level: envLogLevel }, pretty);

const rootNamespace = 'toolsync';

const rootDebug = setupDebug(rootNamespace);
let debugEnabledViaLogLevel = false;
if (!envDebug && (envLogLevel === 'debug' || envLogLevel === 'trace')) {
  debugEnabledViaLogLevel = true;
  setupDebug.enable(`${rootNamespace}:*`);
}

type LogFn = (message: string, data?: Record<string, any>) => void;

interface LogFns {
  trace: LogFn;
  debug: LogFn;
  timing: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  silent: LogFn;
}

class Logger implements LogFns {
  protected pino: pino.Logger;
  protected debugger: Debugger;

  // Expose pino methods
  trace: LogFn;
  debug: LogFn;
  timing: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  fatal: LogFn;
  silent: LogFn;

  get level() {
    return this.pino.level;
  }

  constructor(
    readonly ns: string,
    parent?: Logger,
  ) {
    this.pino = parent
      ? parent.pino.child({ ns: parent.pino === rootLogger ? ns : `${parent.ns}:${ns}` })
      : rootLogger;

    this.debugger = parent ? parent.debugger.extend(ns) : rootDebug;

    // Expose debug methods
    if (debugEnabledViaLogLevel) {
      this.debug = (message: string, data?: Record<string, any>) => this.pino.debug(data, message);

      const timingPino = this.pino.child({ ns: `${this.ns}:timing` });
      this.timing = (message: string, data?: Record<string, any>) =>
        timingPino.debug(data, message);
    } else {
      this.debug = this.debugger;
      this.timing = this.debugger.extend('timing');
    }

    // Expose pino methods
    this.trace = (msg: string, data = {}) => this.pino.trace(data, msg);
    this.info = (msg: string, data = {}) => this.pino.info(data, msg);
    this.warn = (msg: string, data = {}) => this.pino.warn(data, msg);
    this.error = (msg: string, data = {}) => this.pino.error(data, msg);
    this.fatal = (msg: string, data = {}) => this.pino.fatal(data, msg);
    this.silent = (msg: string, data = {}) => this.pino.silent(data, msg);
  }

  child(ns: string) {
    return new Logger(ns, this);
  }
}

export type { LogFns as Logger };

export const logger = new Logger(rootNamespace);

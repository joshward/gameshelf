import { default as color } from 'ansicolor';
import { default as ololog } from 'ololog';

// Setup ololog to handle all global node errors
ololog.handleNodeErrors();

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info' ,
  WARN = 'warn',
  ERROR = 'error',
  NONE = 'none',
}

export const logLevelOrder: ReadonlyArray<LogLevel> = [
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
  LogLevel.NONE
];
type LogMethod = (...m: unknown[]) => void;
export type Logger = Readonly<Record<LogLevel, LogMethod>>;

const noopLog: LogMethod = () => {};

const debugLog = (log: ololog, ...f: unknown[]): LogMethod =>
  (...m: unknown[]) =>
    log.darkGray.debug(...f, ...m);

const infoLog = (log: ololog, ...f: unknown[]): LogMethod =>
  (...m: unknown[]) =>
    log.lightBlue.info(...f, ...m);

const warnLog = (log: ololog, ...f: unknown[]): LogMethod =>
  (...m: unknown[]) =>
    log.yellow.warn(...f, ...m);

const errorLog = (log: ololog, ...f: unknown[]): LogMethod =>
  (...m: unknown[]) =>
    log.red.error(...f, ...m);

const isAtLeast = (value: LogLevel, min: LogLevel): boolean => {
  return logLevelOrder.indexOf(value) >= logLevelOrder.indexOf(min);
}

export interface LoggerOptions {
  level?: LogLevel;
}

export const getLogger = (name: string, options?: LoggerOptions): Logger => {
  const log = ololog.configure({ locate: false});
  const minLevel = options?.level ?? LogLevel.INFO;
  const styledName = color.italic.underline.bgDarkGray.black(name);

  return {
    debug: isAtLeast(LogLevel.DEBUG, minLevel) ? debugLog(log, styledName) : noopLog,
    info: isAtLeast(LogLevel.INFO, minLevel) ? infoLog(log, styledName) : noopLog,
    warn: isAtLeast(LogLevel.WARN, minLevel) ? warnLog(log, styledName) : noopLog,
    error: isAtLeast(LogLevel.ERROR, minLevel) ? errorLog(log, styledName) : noopLog,
    none: noopLog,
  }
}

export const Chars = {
  Bullet: '•',
  Tab: '\t',
};

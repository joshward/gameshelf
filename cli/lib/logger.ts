type LogMethod = (message: string) => void;

export type LogType =
  | 'Debug'
  | 'Info'
  | 'Success'
  | 'Warn'
  | 'Fail'

export interface LogMessage {
  type: LogType;
  text: string;
}

export interface Logger {
  readonly debug: LogMethod;
  readonly info: LogMethod;
  readonly success: LogMethod;
  readonly warn: LogMethod;
  readonly fail: LogMethod;
}

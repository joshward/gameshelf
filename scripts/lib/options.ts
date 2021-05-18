import { default as commander } from "commander";
import { LogLevel, LoggerOptions, logLevelOrder } from "./logger";

export interface CommonOptions {
  log: LogLevel;
}

export const buildLogOptions = (options: CommonOptions): LoggerOptions => ({
  level: options.log,
})

const logLevelDescriptionList = logLevelOrder.join(', ');
const logLevelRegex = new RegExp(`^${logLevelOrder.join('|')}$`);

export const createCommandWithCommonOptions = (): commander.Command => {
  const command = new commander.Command();

  return command
    .passCommandToAction(false)
    .storeOptionsAsProperties(false)
    .option('--log <level>', `log level (${logLevelDescriptionList})`, logLevelRegex, LogLevel.INFO);
}

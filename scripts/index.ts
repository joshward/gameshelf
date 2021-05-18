import 'reflect-metadata';
import { Command } from 'commander';
import { getLogger } from './lib/logger';
import { getStatusCommand } from './status';
import { getLoadCommand } from './load';

export const program = new Command();

program
  .name('game-loader')
  .passCommandToAction(false)
  .storeOptionsAsProperties(false)
  .addCommand(getStatusCommand())
  .addCommand(getLoadCommand());

program.parseAsync()
  .then(() => process.exit(0))
  .catch(getLogger('main').error);

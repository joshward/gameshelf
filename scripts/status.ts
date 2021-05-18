import { default as commander } from 'commander';
import { default as color } from 'ansicolor';
import { getConfig, Config } from './lib/config';
import {
  CommonOptions,
  buildLogOptions,
  createCommandWithCommonOptions
} from './lib/options';
import { loadMasterList, MasterList } from './lib/master-list';
import { Logger, Chars } from './lib/logger';
import { stringifyError } from './lib/core/error';
import { loadGameDataList, GameDataList } from './lib/game-data-list';
import { ListComparer } from './lib/list-comparer';

interface StatusOptions extends CommonOptions {
  full?: boolean;
}

export const getStatusCommand = (): commander.Command => {
  const command = createCommandWithCommonOptions();

  const getOptions = () => command.opts() as StatusOptions;

  command
    .name('status')
    .description('Get the status of the loaded game data')
    .option('-f, --full', 'Compare the two files for changes')
    .action(() => outputStatus(getOptions()));

  return command;
};

const outputStatus = async (options: StatusOptions): Promise<void> => {
  const config = await getConfig(buildLogOptions(options));
  const logger = config.getLogger('status');

  const masterList = await getMasterList(config, logger);
  const gameDataList = await getGameDataList(config, logger);

  if (!options.full) {
    return;
  }

  if (!masterList) {
    if (gameDataList.length) {
      logger.warn('Can\'t full compare master list to game data list.');
    }
    return;
  }

  await displayDiff(config, logger, masterList, gameDataList);
};

const getMasterList = async (config: Config, logger: Logger): Promise<MasterList | undefined> => {
  try {
    const masterList = await loadMasterList(config);

    logger.info('Master game count:', masterList.games.length);
    logger.info(
      'Master expansion count:',
      masterList.games
        .map(game => game.expansions?.length ?? 0)
        .reduce((count, sum) => sum + count, 0),
    );

    return masterList;
  } catch (error) {
    logger.warn('Master List missing or failing to load.', color.darkGray(stringifyError(error)));
  }

  return undefined;
}

const getGameDataList = async (config: Config, logger: Logger): Promise<GameDataList> => {
  const gameDataList = await loadGameDataList(config);

  logger.info('Generated game data count:', gameDataList.length);
  logger.info(
    'Generated expansion data count:',
    gameDataList
      .map(game => game.expansions.length)
      .reduce((count, sum) => sum + count, 0),
  );

  return gameDataList;
};

const displayDiff = async (
  config: Config,
  logger: Logger,
  masterList: MasterList,
  dataList: GameDataList,
): Promise<void> => {
  const comparer = new ListComparer(config);

  const comparisons = await comparer.compare(masterList, dataList, {
    added: true,
    modified: true,
    removed: true,
  });

  for (const addedGame of comparisons.added) {
    logger.info(color.green('Added game'), addedGame.details.name, `(${addedGame.bggId})`);
    for (const addedExpansion of addedGame.expansions) {
      logger.info(Chars.Tab, Chars.Bullet, color.green('Expansion'), addedExpansion.details.name, `(${addedExpansion.bggId})`);
    }
  }

  for (const removedGames of comparisons.removed) {
    logger.info(color.red('Removed game'), removedGames.name, `(${removedGames.bggId})`);
  }

  for (const modifiedGame of comparisons.modified) {
    logger.info(color.yellow('Modified game'), modifiedGame.details.name, `(${modifiedGame.bggId})`);

    for (const change of modifiedGame.changes) {
      let action = `${change.type}`;
      switch (change.type) {
        case 'AddedExpansion':
          action = color.green('Added Expansion');
          break;
        case 'RemovedExpansion':
          action = color.red('Removed Expansion');
          break;
        case 'ModifiedKey':
          action = color.yellow('Modified');
          break;
      }

      logger.info(Chars.Tab, Chars.Bullet, action, change.name);
    }
  }
}

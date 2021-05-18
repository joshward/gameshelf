import { default as commander } from 'commander';
import { default as color } from 'ansicolor';
import {
  CommonOptions,
  createCommandWithCommonOptions,
  buildLogOptions
} from "./lib/options";
import { getConfig, Config } from './lib/config';
import {
  ListComparer,
  RemovedGame,
  AddedGame,
  ExpansionItem,
  ModifiedGame,
} from './lib/list-comparer';
import { loadMasterList, MasterListGame } from './lib/master-list';
import { loadGameDataList, GameDataList, GameDataGame, saveGameDataList, GameDataExpansion } from './lib/game-data-list';
import { Logger, Chars } from './lib/logger';
import { BggLookup, VersionInfo } from './lib/bgg-lookup';
import { stringifyError } from './lib/core/error';
import { ImageBuilder, ImageInfo } from './lib/image-builder';
import { BggExpansion, BggGame } from './lib/bgg-api';

interface LoadOptions extends CommonOptions {
  dry?: boolean;
}

export const getLoadCommand = (): commander.Command => {
  const command = createCommandWithCommonOptions();

  const getOptions = () => command.opts() as LoadOptions;

  command
    .name('load')
    .description('Load the game data from the custom list')
    .option('-d, --dry', 'Run without saving changes')
    .action(() => loadGameData(getOptions()));

  return command;
};

const loadGameData = async (options: LoadOptions): Promise<void> => {
  const config = await getConfig(buildLogOptions(options));
  const logger = config.getLogger('load');

  const masterList = await loadMasterList(config);
  let gameDataList = await loadGameDataList(config);

  const comparer = new ListComparer(config);
  const comparisons = await comparer.compare(masterList, gameDataList, {
    added: true,
    removed: true,
    modified: true,
  });

  gameDataList = await addGames(comparisons.added, gameDataList, config, logger);
  gameDataList = removeGames(comparisons.removed, gameDataList, logger);
  gameDataList = await updateGames(comparisons.modified, gameDataList, config, logger);

  if (options.dry) {
    logger.info('Dry run skipping save');
  }

  await saveGameDataList(gameDataList, config);
};

interface LookedupExpansion {
  bggId: number,
  bggExpansion: BggExpansion,
}

const addGames = async(
  addedGames: AddedGame[],
  gameDataList: GameDataList,
  config: Config,
  logger: Logger,
): Promise<GameDataList> => {
  if (!addedGames.length) {
    return gameDataList;
  }

  const bggLookup = new BggLookup(config);
  const imageBuilder = new ImageBuilder(config);
  const addedDataGames: GameDataList = [];

  for (const game of addedGames) {
    const versionInfo: VersionInfo = {
      name: game.details.versionName,
      id: game.details.version,
    };

    logger.info(
      color.green('Adding'), game.details.name, `(${game.bggId})`,
      (versionInfo.id || versionInfo.name) ? `Version: ${versionInfo.name ?? ''} ${versionInfo.id ?? ''}` : '',
    );

    try {
      const bggGame = await bggLookup.lookupGame(game.bggId, versionInfo);
      const bggExpansions = await lookupExpansions(game.expansions, bggLookup, logger);
      const imageInfo = await imageBuilder.buildImageInfo(game, bggGame.imageUrl);

      const dataGame = buildDataGame(game.bggId, game.details, bggGame, bggExpansions, imageInfo);
      logger.debug(dataGame);
      addedDataGames.push(dataGame);
    } catch (error) {
      logger.error('Failed to add game', game.details.name, `(${game.bggId})`, stringifyError(error));
    }
  }

  return [
    ...gameDataList,
    ...addedDataGames,
  ];
};

const lookupExpansions = async (
  expansions: ExpansionItem[],
  bggLookup: BggLookup,
  logger: Logger,
): Promise<LookedupExpansion[]> => {
  const bggExpansions: LookedupExpansion[] = [];

  for (const expansion of expansions) {
    try {
      logger.info(Chars.Tab, Chars.Bullet, color.green('Expansion'), expansion.details.name, `(${expansion.bggId})`);

      const bggExpansion = await bggLookup.lookupExpansion(expansion.bggId);
      bggExpansions.push({
        bggExpansion,
        bggId: expansion.bggId,
      });
    } catch (error) {
      logger.error('Failed to lookup expansion', expansion.details.name, `(${expansion.bggId})`, stringifyError(error));
    }
  }

  return bggExpansions;
};

const removeGames = (
  removedGames: RemovedGame[],
  gameDataList: GameDataList,
  logger: Logger,
): GameDataList => {
  const removedIds = removedGames.map(game => game.bggId);

  return gameDataList.filter(game => {
    const isRemoved = removedIds.includes(game.bggId);

    if (isRemoved) {
      logger.info(color.red('Removing'), game.name, `(${game.bggId})`);
    }

    return !isRemoved;
  });
};

const updateGames = async (
  modifiedGames: ModifiedGame[],
  gameDataList: GameDataList,
  config: Config,
  logger: Logger,
): Promise<GameDataList> => {
  if (!modifiedGames.length) {
    return gameDataList;
  }

  const bggLookup = new BggLookup(config);
  const imageBuilder = new ImageBuilder(config);

  for (const game of modifiedGames) {
    const dataGame = gameDataList.find(item => item.bggId === game.bggId);
    if (!dataGame) {
      logger.error('Could not update game. Failed to find', game.bggId);
      continue;
    }

    const versionInfo: VersionInfo = {
      name: game.details.versionName,
      id: game.details.version,
    };

    logger.info(
      color.yellow('Updating'), game.details.name, `(${game.bggId})`,
      (versionInfo.id || versionInfo.name) ? `Version: ${versionInfo.name ?? ''} ${versionInfo.id ?? ''}` : '',
    );

    let valuesChanged = false;
    let expansionsChanged = false;
    let versionChanged = false;

    for (const change of game.changes) {
      switch (change.type) {
        case 'AddedExpansion':
        case 'RemovedExpansion':
          expansionsChanged = true;
          break;
        case 'ModifiedKey':
          valuesChanged = true;
          if (change.name === 'version' || change.name === 'versionName') {
            versionChanged = true;
          }
          break;
      }
    }

    if (valuesChanged) {
      dataGame.new = game.details.new;
      dataGame.favorite = game.details.favorite;
      dataGame.wifeFavorite = game.details.wifeFavorite;
      dataGame.name = game.details.name;
    }

    if (expansionsChanged) {
      try {
        const bggExpansions = await lookupExpansions(game.expansions, bggLookup, logger);
        dataGame.expansions = bggExpansions.map(mapExpansion);
      } catch (error) {
        logger.error('Failed to updated expansions for', game.details.name, `(${game.bggId})`, stringifyError(error));
      }
    }

    if (versionChanged) {
      try {
        const bggGame = await bggLookup.lookupGame(game.bggId, versionInfo);
        const imageInfo = await imageBuilder.buildImageInfo(game, bggGame.imageUrl);

        dataGame.version = game.details.version;
        dataGame.versionName = game.details.versionName;

        dataGame.image = imageInfo.image;
        dataGame.thumbnail = imageInfo.thumbnail,
        dataGame.minPlayers = bggGame.minPlayers;
        dataGame.maxPlayers = bggGame.maxPlayers;
        dataGame.playingTime = bggGame.playTime;
        dataGame.year = bggGame.publishedYear;
        dataGame.designers = bggGame.designers.map(cleanValue);
        dataGame.publisher = bggGame.publisher;
        dataGame.categories = bggGame.categories;
        dataGame.mechanics = bggGame.mechanics;
        dataGame.rating = bggGame.rating;
        dataGame.weight = bggGame.weight;
        dataGame.description = bggGame.description;
      } catch (error) {
        logger.error('Failed update version info for', game.details.name, `(${game.bggId})`, stringifyError(error));
      }
    }
  }

  return gameDataList;
};

const buildDataGame = (
  bggId: number,
  masterGame: MasterListGame,
  bggGame: BggGame,
  bggExpansions: LookedupExpansion[],
  imageInfo: ImageInfo,
): GameDataGame => ({
  bggId,
  name: masterGame.name,
  version: masterGame.version,
  versionName: masterGame.versionName,

  image: imageInfo.image,
  thumbnail: imageInfo.thumbnail,
  minPlayers: bggGame.minPlayers,
  maxPlayers: bggGame.maxPlayers,
  playingTime: bggGame.playTime,
  year: bggGame.publishedYear,
  designers: bggGame.designers.map(cleanValue),
  publisher: bggGame.publisher,
  categories: bggGame.categories,
  mechanics: bggGame.mechanics,
  expansions: bggExpansions.map(mapExpansion),
  rating: bggGame.rating,
  weight: bggGame.weight,
  description: bggGame.description,

  favorite: masterGame.favorite,
  wifeFavorite: masterGame.wifeFavorite,
  new: masterGame.new,
});

const mapExpansion = (expansion: LookedupExpansion): GameDataExpansion => ({
  bggId: expansion.bggId,
  name: expansion.bggExpansion.name,
  year: expansion.bggExpansion.publishedYear,
});

const cleanValue = (value: string): string => {
  return value.replace(/\s*\(.*\)$/, '');
}

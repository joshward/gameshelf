import { MasterListGame, MasterList, MasterListExpansion } from "./master-list";
import { Config } from "./config";
import { GameDataList, GameDataGame } from "./game-data-list";
import { Logger } from "./logger";
import { BggLookup, LookupError } from "./bgg-lookup";
import { stringifyError } from "./core/error";
import { buildLookup, Dict } from "./core/utils";

type ComparisonCheck = (data: GameDataGame) => unknown;

const comparisonRecord: Record<keyof MasterListGame, ComparisonCheck | null> = {
  bggId: null,
  expansions: null,
  skip: null,

  favorite: data => data.favorite,
  wifeFavorite: data => data.wifeFavorite,
  name: data => data.name,
  new: data => data.new,
  version: data => data.version,
  versionName: data => data.versionName,
}

const comparisons = Object.entries(comparisonRecord)
  .filter((comparison): comparison is [keyof MasterListGame, ComparisonCheck] => comparison[1] !== null);

export interface ExpansionItem {
  bggId: number;
  details: MasterListExpansion;
}

export interface AddedGame {
  bggId: number;
  details: MasterListGame;
  expansions: ExpansionItem[],
}

export interface RemovedGame {
  bggId: number;
  name: string;
}

export type ChangeType = 'AddedExpansion' | 'RemovedExpansion' | 'ModifiedKey';

export interface KeyChange {
  type: 'ModifiedKey',
  name: keyof MasterListGame,
}

export interface ExpansionChange {
  type: 'AddedExpansion' | 'RemovedExpansion';
  name: string;
}

export type Change = KeyChange | ExpansionChange;

export interface ModifiedGame {
  bggId: number;
  details: MasterListGame;
  changes: Change[];
  expansions: ExpansionItem[];
}

export interface ListChanges {
  added: AddedGame[];
  removed: RemovedGame[];
  modified: ModifiedGame[];
}

export interface ListCompareOptions {
  added?: boolean;
  removed?: boolean;
  modified?: boolean;
}

export class ListComparer {
  private readonly bggLookup: BggLookup;
  private readonly logger: Logger;

  constructor(
    config: Config,
  ) {
    this.bggLookup = new BggLookup(config);
    this.logger = config.getLogger('list-comparer');
  }

  public async compare(
    masterList: MasterList,
    dataList: GameDataList,
    options: ListCompareOptions,
  ): Promise<ListChanges> {
    let added: AddedGame[] = [];
    let removed: RemovedGame[] = [];
    let modified: ModifiedGame[] = [];

    const checkAdded = options.added;
    const checkRemoved = options.removed;
    const checkModified = options.modified;

    const masterListLookup = await this.buildMasterListLookup(masterList);
    const masterListExpansionLookup = await this.buildMasterListExpansionLookup(masterListLookup);
    const dataListLookup = buildLookup(dataList, item => item.bggId);

    if (checkAdded) {
      added = this.findAdded(masterListLookup, dataListLookup, masterListExpansionLookup);
    }

    if (checkModified) {
      modified = this.findModified(masterListLookup, dataListLookup, masterListExpansionLookup);
    }

    if (checkRemoved) {
      removed = this.findRemoved(masterListLookup, dataListLookup);
    }

    return {
      added,
      removed,
      modified,
    }
  }

  private async buildMasterListLookup(masterList: MasterList): Promise<Dict<MasterListGame>> {
    const dict: Dict<MasterListGame> = {};

    for (const game of masterList.games) {
      try {
        const bggId = game.bggId || (await this.bggLookup.lookupId(game.name));

        if (bggId in dict) {
          this.logger.error('Duplicate game entry', game.name, `(${bggId})`);
          continue;
        }

        dict[bggId] = game;
      } catch (error) {
        this.handleLookupError(error, game.name);
      }
    }

    return dict;
  }

  private async buildMasterListExpansionLookup(
    masterList: Dict<MasterListGame>
  ): Promise<Dict<Dict<MasterListExpansion>>> {
    const dict: Dict<Dict<MasterListExpansion>> = {};

    for (const [bggId, { expansions }] of Object.entries(masterList)) {
      if (!expansions?.length) {
        continue;
      }

      const expansionDict: Dict<MasterListExpansion> = {};

      for (const expansion of expansions) {
        try {
          const bggId = expansion.bggId ?? (await this.bggLookup.lookupId(expansion.name));

          if (bggId in expansionDict) {
            this.logger.error('Duplicate expansion entry', expansion.name, `(${bggId})`);
            continue;
          }

          expansionDict[bggId] = expansion;
        } catch (error) {
          this.handleLookupError(error, expansion.name);
        }
      }

      dict[bggId] = expansionDict;
    }

    return dict;
  }

  private handleLookupError(error: any, name: string): void {
    if (error instanceof LookupError) {
      this.logger.warn(
        'Unable to lookup bgg id ->',
        error.message,
        error.matches?.map(match => `${match.name} (${match.year}) [${match.id}]`) ?? ''
      );
    } else {
      this.logger.warn('Unable to lookup bgg id for', name, stringifyError(error));
    }
  }

  private findAdded(
    masterListLookup: Dict<MasterListGame>,
    dataListLookup: Dict<GameDataGame>,
    masterExpansionLookup: Dict<Dict<MasterListExpansion>>,
  ): AddedGame[] {
    return Object.keys(masterListLookup)
      .filter(bggId => dataListLookup[bggId] === undefined)
      .map(bggId => ({
        bggId: parseInt(bggId),
        details: masterListLookup[bggId],
        expansions: this.buildExpansions(masterExpansionLookup[bggId]),
      }));
  }

  private findModified(
    masterListLookup: Dict<MasterListGame>,
    dataListLookup: Dict<GameDataGame>,
    masterExpansionLookup: Dict<Dict<MasterListExpansion>>,
  ): ModifiedGame[] {
    const matchedIds = Object.keys(masterListLookup)
      .filter(bggId => bggId in dataListLookup);

    const modifications: ModifiedGame[] = [];

    for (const id of matchedIds) {
      const masterGame = masterListLookup[id];
      const masterExpansions = masterExpansionLookup[id] ?? {};
      const dataGame = dataListLookup[id];
      const dataGameExpansions = buildLookup(dataGame.expansions, expansion => expansion.bggId);

      const changes: Change[] = comparisons
        .filter(([key, check]) => check(dataGame) !== masterGame[key])
        .map(([key]): Change => ({
          type: 'ModifiedKey',
          name: key,
        }));

      const addedExpansions = Object.entries(masterExpansions)
        .filter(([bggId]) => !(bggId in dataGameExpansions))
        .map(([_, { name }]): Change => ({
          name,
          type: 'AddedExpansion',
        }));

      const removedExpansions = Object.values(dataGameExpansions)
        .filter(({ bggId }) => !(bggId in masterExpansions))
        .map(({ name }): Change => ({
          name,
          type: 'RemovedExpansion',
        }));

      changes.push(...addedExpansions, ...removedExpansions);

      if (changes.length) {
        modifications.push({
          bggId: parseInt(id),
          changes: changes,
          details: masterGame,
          expansions: this.buildExpansions(masterExpansions),
        });
      }
    }

    return modifications;
  }

  private buildExpansions(
    expansionLookup?: Dict<MasterListExpansion>
  ): ExpansionItem[] {
    if (!expansionLookup) {
      return [];
    }

    return Object.entries(expansionLookup)
      .map(([bggId, details]) => ({
        details,
        bggId: parseInt(bggId),
      }));
  }

  private findRemoved(masterListLookup: Dict<MasterListGame>, dataListLookup: Dict<GameDataGame>): RemovedGame[] {
    return Object.keys(dataListLookup)
      .filter(bggId => !(bggId in masterListLookup))
      .map(bggId => ({
        bggId: parseInt(bggId),
        name: dataListLookup[bggId].name,
      }));
  }
}

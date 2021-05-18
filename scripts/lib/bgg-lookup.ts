import { Config } from "./config";
import { loadData, saveData } from "./core/data";
import {
  BggApi,
  SearchMatch,
  BggGameWithVersions,
  BggGame,
  BggGameVersion,
  BggExpansion,
} from "./bgg-api";

export class LookupError extends Error {
  constructor(
    name: string,
    message: string,
    public matches?: SearchMatch[],
  ) {
    super(`Bgg Id Lookup for "${name}" failed with ${message}.`);
  }
}

type BggIdCache = {
  [name: string]: number;
}

export interface VersionInfo {
  name?: string;
  id?: number;
}

export class BggLookup {
  private readonly idFile: string;
  private idCache?: BggIdCache;
  private client: BggApi;

  constructor(config: Config) {
    const {
      bggIdFile,
    } = config.cache;

    this.idFile = bggIdFile;
    this.client = new BggApi(config);
  }

  public async lookupId(name: string): Promise<number> {
    if (!this.idCache) {
      this.idCache = await this.loadIdCache();
    }

    if (this.idCache[name] != null) {
      return this.idCache[name];
    }

    this.idCache[name] = await this.lookupBggId(name);
    await this.saveIdCache(this.idCache);
    return this.idCache[name];
  }

  public async lookupGame(bggId: number, version?: VersionInfo): Promise<BggGame> {
    const result = await this.client.getGame(bggId);
    if (!result) {
      throw new Error(`No game found with id ${bggId}`);
    }

    return this.mergeVersionInfo(result, version);
  }

  public async lookupExpansion(bggId: number): Promise<BggExpansion> {
    const result = await this.client.getExpansion(bggId);
    if (!result) {
      throw new Error(`No expansion found with id ${bggId}`);
    }

    return result;
  }

  private async loadIdCache(): Promise<BggIdCache> {
    return loadData<BggIdCache>(this.idFile, {
      default: () => ({}),
    });
  }

  private async saveIdCache(idCache: BggIdCache): Promise<void> {
    return saveData(this.idFile, idCache);
  }

  private async lookupBggId(name: string): Promise<number> {
    const results = await this.client.search(name);

    if (results.length === 0) {
      throw new LookupError(name, 'no results');
    }

    const exactMatches = results.filter(result => result.name === name);

    if (exactMatches.length === 1) {
      return exactMatches[0].id;
    }

    if (exactMatches.length) {
      throw new LookupError(name, 'multiple exact matches', results);
    }

    throw new LookupError(name, 'no exact matches', results);
  }

  private mergeVersionInfo(game: BggGameWithVersions, versionInfo?: VersionInfo): BggGame {
    const {
      versions,
      ...gameData
    } = game;

    if (!versionInfo?.id && !versionInfo?.name) {
      return gameData;
    }

    const version: BggGameVersion | undefined =
      versions.find(version => version.versionId === versionInfo.id || version.versionName === versionInfo.name);

    if (!version) {
      throw new Error(`Unable to find game version ${versionInfo.name} [${versionInfo.id}] for ${game.name}`);
    }

    const {
      versionId,
      versionName,
      ...versionData
    } = version;

    return {
      ...gameData,
      ...versionData,
    }
  }
}

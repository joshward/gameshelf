import { default as xmlFormat } from 'xml-formatter';
import { Config } from "./config";
import { BggApiClient, ApiObjectType, ApiGetOptions } from "./bgg-api-client";
import { XmlReader, XmlElement, XmlValue, XmlNode } from "./core/xml-reader";
import { Logger } from "./logger";
import { stringifyError } from "./core/error";
import { asArray } from "./core/utils";
import { readFile, writeFile } from "./core/file";

export interface SearchMatch {
  id: number;
  name: string;
  year?: string;
}

interface CommonAttributes {
  thumbnailUrl: string;
  imageUrl: string;
  publisher: string;
  publishedYear: string;
  artists: string[];
}

export interface BggGameVersion extends Partial<CommonAttributes> {
  versionName: string;
  versionId: number;
}

export interface BggGame extends CommonAttributes {
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  playTime: number;
  categories: string[];
  mechanics: string[];
  families: string[];
  designers: string[];
  weight: number;
  rating: number;
}

export interface BggExpansion {
  name: string;
  description: string;
  thumbnailUrl: string;
  imageUrl: string;
  publishedYear: string;
}

export interface BggGameWithVersions extends BggGame {
  versions: BggGameVersion[];
}

const getTypedNodeValues = (element: XmlElement, node: string, type: string) => {
  try {
   return element
    .getNode(node)
    .asMany()
    .filter(link => link.getAttribute('type', { optional: true })?.asString() === type)
    .map(link => link.getAttribute('value'));
  } catch (error) {
    throw new Error(`Failed to get typed node "${node}[${type}]" values: ${stringifyError(error)}`);
  }
}

const getOptionalTypedNodeValues = (element: XmlElement, node: string, type: string) => {
  const values = getTypedNodeValues(element, node, type);
  return values.length ? values : undefined;
}

const getSingleTypedNodeValue = (
  element: XmlElement,
  node: string,
  type: string,
  filter: (values: XmlValue[]) => XmlValue[] = values => values,
) => {
  const values = filter(getTypedNodeValues(element, node, type));
  if (values.length === 0) {
    throw new Error(`Failed to get typed node "${node}[${type}]" value. No matches.`)
  }

  if (values.length > 1) {
    throw new Error(`Failed to get typed node "${node}[${type}]" value. Multiple matches.`)
  }

  return values[0];
}

const getOptionalSingleTypedNodeValue = (
  element: XmlElement,
  node: string,
  type: string,
  filter: (values: XmlValue[]) => XmlValue[] = values => values,
) => {
  const values = filter(getTypedNodeValues(element, node, type));
  if (values.length === 0) {
    return undefined;
  }

  if (values.length > 1) {
    throw new Error(`Failed to get optional typed node "${node}[${type}]" value. Multiple matches.`)
  }

  return values[0];
}

const getSingleNodeValue = (element: XmlElement, node: string) => {
  try {
    return element
      .getNode(node)
      .asSingle()
      .getAttribute('value');
  } catch (error) {
    throw new Error(`Failed to get single node "${node}" value: ${stringifyError(error)}`);
  }
}

const getOptionalSingleNodeValue = (element: XmlElement | undefined, node: string) => {
  try {
    return element
      ?.getNode(node)
      .asSingle({ optional: true })
      ?.getAttribute('value');
  } catch (error) {
    throw new Error(`Failed to get optional single node "${node}" value: ${stringifyError(error)}`);
  }
}

const getSingleNodeContent = (element: XmlElement, node: string) => {
  try {
    return element
      .getNode(node)
      .asSingle()
      .getText();
  } catch (error) {
    throw new Error(`Failed to get single node "${node}" content: ${stringifyError(error)}`);
  }
}

const getOptionalSingleNodeContent = (element: XmlElement, node: string) => {
  try {
    return element
      .getNode(node)
      .asSingle({ optional: true })
      ?.getText({ optional: true });
  } catch (error) {
    throw new Error(`Failed to get optional single node "${node}" content: ${stringifyError(error)}`);
  }
}

export interface BggApiOptions {
  skipBggGet?: boolean;
}

export class BggApi {
  private readonly client: BggApiClient;
  private readonly logger: Logger;
  private readonly cacheConfig: Config['cache'];
  private readonly apiOptions?: BggApiOptions;

  constructor(config: Config, options?: BggApiOptions) {
    this.client = new BggApiClient(config);
    this.cacheConfig = config.cache;
    this.logger = config.getLogger('BggApi');
    this.apiOptions = options;
  }

  public async search(name: string): Promise<SearchMatch[]> {
    const searchTerm = this.buildSearchTerm(name);
    const xml = await this.client.search(searchTerm);

    try {
      const reader = await XmlReader.parse(xml);

      return reader
        .getNode('item')
        .asMany()
        .map(match => ({
          id: match
            .getAttribute('id')
            .asInt(),
          name: getSingleNodeValue(match, 'name')
            .asString(),
          year: getOptionalSingleNodeValue(match, 'yearpublished')
            ?.asString(),
        }));
    } catch (error) {
      this.logger.debug(xml);
      throw new Error(`Failed to parse bgg search results: ${stringifyError(error)}`);
    }
  }

  public async getGame(bggId: number): Promise<BggGameWithVersions | null> {
    const xml = await this.cachedGet(bggId, {
      withVersions: true,
      withStats: true,
    });

    try {
      const reader = await XmlReader.parse(xml);

      const gameNode = reader
        .getNode('item')
        .asSingle({ optional: true });

      if (gameNode == null) {
        return null;
      }

      const ratingsNode = gameNode
        .getNode('statistics').asSingle()
        .getNode('ratings').asSingle();

      const versionItems = gameNode
        .getNode('versions').asSingle()
        .getNode('item').asMany();

      return {
        artists: getTypedNodeValues(gameNode, 'link', 'boardgameartist').map(artist => artist.asString()),
        categories: getTypedNodeValues(gameNode, 'link', 'boardgamecategory').map(category => category.asString()),
        description: getSingleNodeContent(gameNode, 'description').asString(),
        designers: getTypedNodeValues(gameNode, 'link', 'boardgamedesigner').map(designer => designer.asString()),
        families: getTypedNodeValues(gameNode, 'link', 'boardgamefamily').map(family => family.asString()),
        imageUrl: getSingleNodeContent(gameNode, 'image').asString(),
        maxPlayers: getSingleNodeValue(gameNode, 'maxplayers').asInt(),
        mechanics: getTypedNodeValues(gameNode, 'link', 'boardgamemechanic').map(mechanic => mechanic.asString()),
        minPlayers: getSingleNodeValue(gameNode, 'minplayers').asInt(),
        name: getSingleTypedNodeValue(gameNode, 'name', 'primary').asString(),
        playTime: getSingleNodeValue(gameNode, 'playingtime').asInt(),
        publishedYear: getSingleNodeValue(gameNode, 'yearpublished').asString(),
        publisher: getSingleTypedNodeValue(gameNode, 'link', 'boardgamepublisher', values => asArray(values[0])).asString(),
        rating: getSingleNodeValue(ratingsNode, 'average').asDecimal(),
        thumbnailUrl: getSingleNodeContent(gameNode, 'thumbnail').asString(),
        weight: getSingleNodeValue(ratingsNode, 'averageweight').asDecimal(),

        versions: versionItems.map(versionNode => ({
          artists: getOptionalTypedNodeValues(versionNode, 'link', 'boardgameartist')?.map(artist => artist.asString()),
          imageUrl: getOptionalSingleNodeContent(versionNode, 'image')?.asString(),
          publishedYear: getOptionalSingleNodeValue(versionNode, 'yearpublished')?.asString(),
          publisher: getOptionalSingleTypedNodeValue(versionNode, 'link', 'boardgamepublisher', values => asArray(values[0]))?.asString(),
          thumbnailUrl: getOptionalSingleNodeContent(versionNode, 'thumbnail')?.asString(),
          versionId: versionNode.getAttribute('id').asInt(),
          versionName: getSingleTypedNodeValue(versionNode, 'name', 'primary').asString(),
        })),
      };
    } catch (error) {
      this.logger.debug(xml);
      throw new Error(`Failed to parse bgg game ${bggId}: ${stringifyError(error)}`);
    }
  }

  public async getExpansion(bggId: number): Promise<BggExpansion | null> {
    const expansionNode = await this.getExpansionNode(bggId);

    if (!expansionNode) {
      return null;
    }

    try {
      return {
        description: getSingleNodeContent(expansionNode, 'description').asString(),
        imageUrl: getSingleNodeContent(expansionNode, 'image').asString(),
        name: getSingleTypedNodeValue(expansionNode, 'name', 'primary').asString(),
        publishedYear: getSingleNodeValue(expansionNode, 'yearpublished').asString(),
        thumbnailUrl: getSingleNodeContent(expansionNode, 'thumbnail').asString(),
      }
    } catch (error) {
      throw new Error(`Failed to parse bgg expansion ${bggId}: ${stringifyError(error)}`);
    }
  }

  private async getExpansionNode(bggId: number): Promise<XmlElement | undefined> {
    for (const type of [ApiObjectType.EXPANSION, ApiObjectType.BOARD_GAME]) {
      let xml = await this.cachedGet(bggId, {
        type,
      });

      try {
        const reader = await XmlReader.parse(xml);

        const expansionNode = reader
          .getNode('item')
          .asSingle({ optional: true });

        if (expansionNode != null) {
          return expansionNode;
        }
      } catch (error) {
        this.logger.debug(xml);
        throw new Error(`Failed to parse bgg expansion ${bggId} as (${type}): ${stringifyError(error)}`);
      }
    }

    return undefined;
  }

  private async cachedGet(bggId: number, options?: ApiGetOptions): Promise<string> {
    const type = options?.type === ApiObjectType.EXPANSION ? 'e' : 'b';
    const file = this.cacheConfig.buildPath(`bgg_get/${bggId}.${type}.xml`);

    if (!this.apiOptions?.skipBggGet) {
      try {
        const cached = await readFile(file);
        if (cached) {
          return cached;
        }
      } catch (error) {
        this.logger.debug('Failed to read', file, error);
      }
    }

    const xml = await this.client.get(bggId, options);

    try {
      await writeFile(file, xmlFormat(xml));
    } catch (error) {
      this.logger.warn('Failed to write to cache', file, error);
    }

    return xml;
  }

  private buildSearchTerm(name: string): string {
    // BGG is having issue searching for games with certain characters in them
    return name.replace(/[^a-z0-9 ]/i, '');
  }
}

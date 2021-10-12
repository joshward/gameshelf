import { default as xmlFormat } from 'xml-formatter'
import { Config } from './config'
import { BggApiClient, ApiObjectType } from './bgg-api-client'
import { XmlReader, XmlElement, XmlValue } from './core/xml-reader'
import { Logger } from './logger'
import { stringifyError } from './core/error'
import { toArray } from './core/utils'
import { writeFile } from './core/file'

export interface SearchMatch {
  id: number;
  name: string;
  year?: string;
}

interface CommonAttributes {
  thumbnailUrl?: string;
  imageUrl?: string;
  publisher: string;
  publishedYear: string;
  artists: string[];
}

export interface BggGameVersion extends Partial<CommonAttributes> {
  versionName: string;
  versionId: number;
}

export interface BggExpansionLink {
  expansionId: number;
  name: string;
}

export interface BggGame extends CommonAttributes {
  type?: ApiObjectType;
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
  expansionLinks: BggExpansionLink[];
}

export interface BggExpansion {
  name: string;
  description: string;
  publishedYear: string;
}

export interface BggGameWithVersions extends BggGame {
  versions: BggGameVersion[];
}

const getTypedNodes = (element: XmlElement, node: string, type: string) => {
  return element
    .getNode(node)
    .asMany()
    .filter(link => link.getAttribute('type', {optional: true})?.asString() === type)
}

const getTypedNodeIdValues = (element: XmlElement, node: string, type: string) => {
  try {
    return getTypedNodes(element, node, type)
      .map(link => ({
        id: link.getAttribute('id'),
        value: link.getAttribute('value')}
      ))
  } catch (error) {
    throw new Error(`Failed to get typed node "${node}[${type}]" id values: ${stringifyError(error)}`)
  }
}

const getTypedNodeValues = (element: XmlElement, node: string, type: string) => {
  try {
    return getTypedNodes(element, node, type)
      .map(link => link.getAttribute('value'))
  } catch (error) {
    throw new Error(`Failed to get typed node "${node}[${type}]" values: ${stringifyError(error)}`)
  }
}

const getOptionalTypedNodeValues = (element: XmlElement, node: string, type: string) => {
  const values = getTypedNodeValues(element, node, type)
  return values.length ? values : undefined
}

const getSingleTypedNodeValue = (
  element: XmlElement,
  node: string,
  type: string,
  filter: (values: XmlValue[]) => XmlValue[] = values => values,
) => {
  const values = filter(getTypedNodeValues(element, node, type))
  if (values.length === 0) {
    throw new Error(`Failed to get typed node "${node}[${type}]" value. No matches.`)
  }

  if (values.length > 1) {
    throw new Error(`Failed to get typed node "${node}[${type}]" value. Multiple matches.`)
  }

  return values[0]
}

const getOptionalSingleTypedNodeValue = (
  element: XmlElement,
  node: string,
  type: string,
  filter: (values: XmlValue[]) => XmlValue[] = values => values,
) => {
  const values = filter(getTypedNodeValues(element, node, type))
  if (values.length === 0) {
    return undefined
  }

  if (values.length > 1) {
    throw new Error(`Failed to get optional typed node "${node}[${type}]" value. Multiple matches.`)
  }

  return values[0]
}

const getSingleNodeValue = (element: XmlElement, node: string) => {
  try {
    return element
      .getNode(node)
      .asSingle()
      .getAttribute('value')
  } catch (error) {
    throw new Error(`Failed to get single node "${node}" value: ${stringifyError(error)}`)
  }
}

const getOptionalSingleNodeValue = (element: XmlElement | undefined, node: string) => {
  try {
    return element
      ?.getNode(node)
      .asSingle({ optional: true })
      ?.getAttribute('value')
  } catch (error) {
    throw new Error(`Failed to get optional single node "${node}" value: ${stringifyError(error)}`)
  }
}

const getSingleNodeContent = (element: XmlElement, node: string) => {
  try {
    return element
      .getNode(node)
      .asSingle()
      .getText()
  } catch (error) {
    throw new Error(`Failed to get single node "${node}" content: ${stringifyError(error)}`)
  }
}

const getOptionalSingleNodeContent = (element: XmlElement, node: string) => {
  try {
    return element
      .getNode(node)
      .asSingle({ optional: true })
      ?.getText({ optional: true })
  } catch (error) {
    throw new Error(`Failed to get optional single node "${node}" content: ${stringifyError(error)}`)
  }
}

export class BggApi {
  private readonly client: BggApiClient;

  constructor(config: Config, logger: Logger) {
    this.client = new BggApiClient(config, logger)
  }

  public async search(name: string): Promise<SearchMatch[]> {
    const searchTerm = this.buildSearchTerm(name)
    const xml = await this.client.search(searchTerm)

    try {
      const reader = await XmlReader.parse(xml)

      return reader
        .getNode('item')
        .asMany()
        .map(match => ({
          id: match
            .getAttribute('id')
            .asInt(),
          name: getSingleNodeValue(match, 'name')
            .asString(),
          year: match
            ?.getNode('yearpublished')
            .asSingle({ optional: true })
            ?.getAttribute('value', { optional: true })
            ?.asString(),
        }))
    } catch (error) {
      this.dumpXml('search', xml)
      throw new Error(`Failed to parse bgg search results: ${stringifyError(error)}`)
    }
  }

  public async getGame(bggId: number): Promise<BggGameWithVersions | null> {
    const xml = await this.client.get(bggId, {
      withVersions: true,
      withStats: true,
    })

    try {
      const reader = await XmlReader.parse(xml)

      const gameNode = reader
        .getNode('item')
        .asSingle({ optional: true })

      if (gameNode == null) {
        return null
      }

      const ratingsNode = gameNode
        .getNode('statistics').asSingle()
        .getNode('ratings').asSingle()

      const versionItems = gameNode
        .getNode('versions').asSingle()
        .getNode('item').asMany()

      return {
        artists: getTypedNodeValues(gameNode, 'link', 'boardgameartist').map(artist => artist.asString()),
        categories: getTypedNodeValues(gameNode, 'link', 'boardgamecategory').map(category => category.asString()),
        description: getSingleNodeContent(gameNode, 'description').asString(),
        designers: getTypedNodeValues(gameNode, 'link', 'boardgamedesigner').map(designer => designer.asString()),
        families: getTypedNodeValues(gameNode, 'link', 'boardgamefamily').map(family => family.asString()),
        imageUrl: getOptionalSingleNodeContent(gameNode, 'image')?.asString(),
        maxPlayers: getSingleNodeValue(gameNode, 'maxplayers').asInt(),
        mechanics: getTypedNodeValues(gameNode, 'link', 'boardgamemechanic').map(mechanic => mechanic.asString()),
        minPlayers: getSingleNodeValue(gameNode, 'minplayers').asInt(),
        name: getSingleTypedNodeValue(gameNode, 'name', 'primary').asString(),
        playTime: getSingleNodeValue(gameNode, 'playingtime').asInt(),
        publishedYear: getSingleNodeValue(gameNode, 'yearpublished').asString(),
        publisher: getSingleTypedNodeValue(gameNode, 'link', 'boardgamepublisher', values => toArray(values[0])).asString(),
        rating: getSingleNodeValue(ratingsNode, 'average').asDecimal(),
        thumbnailUrl: getOptionalSingleNodeContent(gameNode, 'thumbnail')?.asString(),
        type: gameNode.getAttribute('type', { optional: true })?.asString() as ApiObjectType,
        weight: getSingleNodeValue(ratingsNode, 'averageweight').asDecimal(),
        expansionLinks: getTypedNodeIdValues(gameNode, 'link', 'boardgameexpansion').map(idValue => ({ expansionId: idValue.id.asInt(), name: idValue.value.asString() })),

        versions: versionItems.map(versionNode => ({
          artists: getOptionalTypedNodeValues(versionNode, 'link', 'boardgameartist')?.map(artist => artist.asString()),
          imageUrl: getOptionalSingleNodeContent(versionNode, 'image')?.asString(),
          publishedYear: getOptionalSingleNodeValue(versionNode, 'yearpublished')?.asString(),
          publisher: getOptionalSingleTypedNodeValue(versionNode, 'link', 'boardgamepublisher', values => toArray(values[0]))?.asString(),
          thumbnailUrl: getOptionalSingleNodeContent(versionNode, 'thumbnail')?.asString(),
          versionId: versionNode.getAttribute('id').asInt(),
          versionName: getSingleTypedNodeValue(versionNode, 'name', 'primary').asString(),
        })),
      }
    } catch (error) {
      this.dumpXml(`${bggId}`, xml)
      throw new Error(`Failed to parse bgg game ${bggId}: ${stringifyError(error)}`)
    }
  }

  public async getExpansion(bggId: number): Promise<BggExpansion | null> {
    const expansionNode = await this.getExpansionNode(bggId)

    if (!expansionNode) {
      return null
    }

    try {
      return {
        description: getSingleNodeContent(expansionNode, 'description').asString(),
        name: getSingleTypedNodeValue(expansionNode, 'name', 'primary').asString(),
        publishedYear: getSingleNodeValue(expansionNode, 'yearpublished').asString(),
      }
    } catch (error) {
      throw new Error(`Failed to parse bgg expansion ${bggId}: ${stringifyError(error)}`)
    }
  }

  private async getExpansionNode(bggId: number): Promise<XmlElement | undefined> {
    const xml = await this.client.get(bggId, {
      types: [ApiObjectType.EXPANSION, ApiObjectType.BOARD_GAME]
    })

    try {
      const reader = await XmlReader.parse(xml)

      const expansionNode = reader
        .getNode('item')
        .asSingle({ optional: true })

      return expansionNode
    } catch (error) {
      this.dumpXml(`${bggId}`, xml)
      throw new Error(`Failed to parse bgg expansion ${bggId}: ${stringifyError(error)}`)
    }
  }

  private async dumpXml(name: string, xml: string) {
    await writeFile(`${name}_dump.xml`, xmlFormat(xml))
  }

  private buildSearchTerm(name: string): string {
    // BGG is having issue searching for games with certain characters in them
    // return name.trim().replace(/[^a-z0-9 ]/i, '')
    return name.trim()
  }
}

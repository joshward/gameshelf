import { BggApi, BggGameWithVersions } from './bgg-api'
import { createDateFromTime } from './core/utils'
import { GameList, GameListExpansion, GameProcessingData } from './game-list'
import { ImageManager } from './image-manager'

export interface FoundGame {
  details: BggGameWithVersions;
  bggId: number;
  inCollection: boolean;
}

export type GameFormData = {
  name: string;
  subTitle: string;
  editionTitle: string;
  addedDate?: Date;
  tags: string[];
  versionId?: number;
  expansionsIds: number[];
  sale?: string;
}

export function buildFormData (data: GameProcessingData): GameFormData {
  return {
    name: data.name,
    subTitle: data.subTitle,
    editionTitle: data.editionTitle,
    addedDate: data.addedDate === 0 ? undefined : createDateFromTime(data.addedDate),
    tags: data.tags,
    versionId: data.versionId,
    expansionsIds: data.expansions.map(extension => extension.bggId),
    sale: data.sale,
  }
}

export async function saveGame (
  bggId: number,
  game: BggGameWithVersions,
  formData: GameFormData,
  bggApi: BggApi,
  imageManager: ImageManager,
  gameList: GameList,
): Promise<void> {
  const version = game.versions.find(version => version.versionId === formData.versionId)

  const expansions: GameListExpansion[] = []

  for (const expansionId of formData.expansionsIds) {
    const expansion = await bggApi.getExpansion(expansionId)

    if (!expansion) {
      throw new Error(`Failed to fetch expansion data ${expansionId}`)
    }

    expansions.push({
      bggId: expansionId,
      name: expansion.name,
      year: expansion.publishedYear
    })
  }

  const imageInfo = await imageManager.createImages({
    bggId: bggId,
    name: formData.name,
    imageUrl: version?.imageUrl ?? game.imageUrl
  })

  const data: GameProcessingData = {
    bggId: bggId,
    versionId: version?.versionId,

    name: formData.name,
    subTitle: formData.subTitle,
    editionTitle: formData.editionTitle,
    tags: formData.tags,
    addedDate: formData.addedDate?.getTime() ?? 0,

    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    playingTime: game.playTime,
    year: version?.publishedYear ?? game.publishedYear,
    designers: game.designers,
    publisher: version?.publisher ?? game.publisher,
    categories: game.categories,
    mechanics: game.mechanics,
    rating: game.rating,
    weight: game.weight,
    description: game.description,

    blurhash: imageInfo.blurhash,
    image: imageInfo.image,
    thumbHeight: imageInfo.thumbHeight,
    thumbWidth: imageInfo.thumbWidth,
    thumbnail: imageInfo.thumbnail,

    expansions: expansions,

    sale: formData.sale
  }

  gameList.insertGame(data)
}

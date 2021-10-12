import fg from 'fast-glob'
import { rm } from 'fs/promises'
import { Config } from './config'
import { ImageBuilder, ImageInfo } from './image-builder'
import * as safePath from 'safe-paths'

interface Game {
  bggId: number;
  name: string;
  imageUrl?: string
}

export class ImageManager {
  private readonly imageConfig: Config['image'];
  private readonly imageBuilder: ImageBuilder;

  public constructor (
    config: Config
  ) {
    this.imageConfig = config.image
    this.imageBuilder = new ImageBuilder(config)
  }

  public async createImages (game: Game): Promise<ImageInfo> {
    return await this.imageBuilder.buildImageInfo(
      game.imageUrl ?? `https://via.placeholder.com/600x800?text=${encodeURIComponent(game.name)}`,
      this.buildFileName(game)
    )
  }

  public async deleteImages (bggId: number): Promise<void> {
    const globPath = this.imageConfig.buildPath(`*.${bggId}.*.png`)
    const files = await fg(globPath)
    for (const file of files) {
      await rm(file)
    }
  }

  private buildFileName(game: Game): string {
    const cleanedGameName = safePath.format(game.name).toLocaleLowerCase()
    return `${cleanedGameName}.${game.bggId}`
  }
}

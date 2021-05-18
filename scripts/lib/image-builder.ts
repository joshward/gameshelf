import { default as axios } from 'axios';
import { default as sharp } from 'sharp';
import * as safePath from 'safe-paths';
import { Config } from "./config";
import { AddedGame } from "./list-comparer";
import { stringifyError } from './core/error';
import { makeDirectories } from './core/file';

export interface ImageInfo {
  image: string;
  thumbnail: string;
}

export class ImageBuilder {
  private readonly config: Config['image'];

  constructor(config: Config) {
    this.config = config.image;
  }

  public async buildImageInfo(game: AddedGame, imageUrl: string): Promise<ImageInfo> {
    return {
      image: await this.buildImage(game, imageUrl, this.config.fullsize, 'full'),
      thumbnail: await this.buildImage(game, imageUrl, this.config.thumbnail, 'thumbnail'),
    }
  }

  private async buildImage(
    game: AddedGame,
    imageUrl: string,
    size: { height?: number, width: number },
    type: string,
  ): Promise<string> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data, 'binary');

      const file = this.buildFileName(game, type);
      const fullPath = this.config.buildPath(file);
      await makeDirectories(fullPath);

      await sharp(imageBuffer)
        .resize(
          {
            ...size,
            fit: 'inside',
            withoutEnlargement: true,
          },
        )
        .toFile(fullPath);

      return file;
    } catch(error) {
      throw new Error(`Failed to build ${type} -> ${stringifyError(error)}`);
    }
  }

  private buildFileName(game: AddedGame, type: string): string {
    const cleanedGameName = safePath.format(game.details.name).toLocaleLowerCase();
    return this.config.namePattern
      .replace('{name}', cleanedGameName)
      .replace('{id}', `${game.bggId}`)
      .replace('{type}', type);
  }
}

import { default as axios } from 'axios'
import { default as sharp } from 'sharp'
import * as blurhash from 'blurhash'
import { Config } from './config'
import { stringifyError } from './core/error'
import { makeDirectories } from './core/file'

export interface ImageInfo {
  image: string;
  thumbnail: string;
  thumbHeight: number;
  thumbWidth: number;
  blurhash: string;
}

export class ImageBuilder {
  private readonly config: Config['image'];

  constructor(config: Config) {
    this.config = config.image
  }

  public async buildImageInfo(imageUrl: string, fileName: string): Promise<ImageInfo> {
    const { fileName: image } = await this.buildImage(fileName, imageUrl, this.config.fullsize, 'full')

    const {
      fileName: thumbnail,
      height: thumbHeight,
      width: thumbWidth,
      pixelData: thumbPixelData
    } = await this.buildImage(fileName, imageUrl, this.config.thumbnail, 'thumbnail', true)

    const blurhash = this.buildBlurHash(thumbPixelData, thumbHeight, thumbWidth)

    return {
      image,
      thumbnail,
      thumbHeight,
      thumbWidth,
      blurhash,
    }
  }

  private async buildImage(
    fileName: string,
    imageUrl: string,
    size: { height?: number, width: number },
    type: string,
    includePixelData: true
  ): Promise<{ fileName: string, height: number, width: number, pixelData: Uint8ClampedArray }>;
  private async buildImage(
    fileName: string,
    imageUrl: string,
    size: { height?: number, width: number },
    type: string,
    includePixelData?: false
  ): Promise<{ fileName: string, height: number, width: number, pixelData?: never }>;
  private async buildImage(
    fileName: string,
    imageUrl: string,
    size: { height?: number, width: number },
    type: string,
    includePixelData?: boolean
  ): Promise<{ fileName: string, height: number, width: number, pixelData?: Uint8ClampedArray }> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })
      const imageBuffer = Buffer.from(response.data, 'binary')

      const file = `${fileName}.${type}.png`
      const fullPath = this.config.buildPath(file)
      await makeDirectories(fullPath)

      const { data, info } = await sharp(imageBuffer)
        .raw()
        .ensureAlpha()
        .resize(
          {
            ...size,
            fit: 'inside',
            withoutEnlargement: true,
          },
        )
        .toBuffer({ resolveWithObject: true })

      await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
        .toFile(fullPath)

      return {
        fileName: file,
        height: info.width,
        width: info.height,
        pixelData: includePixelData ? new Uint8ClampedArray(data) : undefined
      }
    } catch(error) {
      throw new Error(`Failed to build ${type} -> ${stringifyError(error)}`)
    }
  }

  private buildBlurHash(data: Uint8ClampedArray, height: number, width: number): string {
    return blurhash.encode(data, height, width, this.config.blurhashX, this.config.blurhashY)
  }
}

import { default as path } from 'path'
import {
  IsOptional,
  IsString,
  ValidateNested,
  IsNotEmpty,
  IsPositive,
  IsInt,
  IsUrl,
  IsBoolean,
  IsNumber,
} from 'class-validator'
import { Type } from 'class-transformer'
import { stringifyError } from './core/error'
import { loadData, ValidationError } from './core/data'
import { walkBackPath } from './core/file'

const CONFIG_FILE = 'config.toml'

class DirectoryConfig {
  @IsOptional()
  @IsString()
  public dir?: string;
}

class DataConfig extends DirectoryConfig {
  @IsNotEmpty()
  @IsString()
  gamesFile!: string;

  @IsNotEmpty()
  @IsString()
  hashFile!: string;

  @IsNotEmpty()
  @IsString()
  initFile!: string;

  @IsPositive()
  @IsInt()
  @IsOptional()
  newCount?: number;

  @IsPositive()
  @IsInt()
  @IsOptional()
  initCount?: number;
}

class ExtendedDataConfig extends DirectoryConfig {
  @IsNotEmpty()
  @IsString()
  dataFile!: string;
}

class ImageSize {
  @IsOptional()
  @IsPositive()
  @IsInt()
  height?: number;

  @IsPositive()
  @IsInt()
  width!: number;
}

class ImageConfig extends DirectoryConfig {
  @ValidateNested()
  @Type(() => ImageSize)
  thumbnail!: ImageSize;

  @ValidateNested()
  @Type(() => ImageSize)
  fullsize!: ImageSize;

  @IsOptional()
  @IsPositive()
  @IsInt()
  blurhashX?: number;

  @IsOptional()
  @IsPositive()
  @IsInt()
  blurhashY?: number;
}

class ApiConfig {
  @IsOptional()
  @IsPositive()
  @IsInt()
  timeout?: number;

  @IsOptional()
  @IsString()
  @IsUrl()
  root?: string;

  @IsOptional()
  @IsBoolean()
  resetTimeout?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  retries?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  baseRetry?: number;
}

class Configuration {
  @ValidateNested()
  @Type(() => DataConfig)
  data!: DataConfig;

  @ValidateNested()
  @Type(() => ExtendedDataConfig)
  extended!: ExtendedDataConfig;

  @ValidateNested()
  @Type(() => ApiConfig)
  api!: ApiConfig;

  @ValidateNested()
  @Type(() => ImageConfig)
  image!: ImageConfig;
}

export class Config {
  constructor(
    private readonly configuration: Configuration,
    private readonly relativeDir: string,
  ) {}

  public get data(): { gamesFile: string, hashFile: string, initFile: string, newCount: number, initCount: number } {
    const { data } = this.configuration
    return {
      gamesFile: this.joinPath(data.dir, data.gamesFile),
      hashFile: this.joinPath(data.dir, data.hashFile),
      initFile: this.joinPath(data.dir, data.initFile),
      newCount: data.newCount ?? 10,
      initCount: data.initCount ?? 12,
    }
  }

  public get extended(): { extendedFile: string } {
    const { extended } = this.configuration
    return {
      extendedFile: this.joinPath(extended.dir, extended.dataFile)
    }
  }

  public get api(): { timeout: number, root: string, resetTimeout: boolean, retries: number, baseRetry: number } {
    const { api = {} } = this.configuration
    return {
      timeout: api.timeout ?? 5000,
      root: api.root ?? 'https://boardgamegeek.com/xmlapi2',
      resetTimeout: api.resetTimeout ?? true,
      retries: api.retries ?? 5,
      baseRetry: api.baseRetry ?? 1000,
    }
  }

  public get image(): { buildPath: (fn: string) => string, fullsize: ImageSize, thumbnail: ImageSize, blurhashX: number, blurhashY: number } {
    const { image } = this.configuration
    return {
      buildPath: (fileName: string) => this.joinPath(image.dir, fileName),
      fullsize: image.fullsize,
      thumbnail: image.thumbnail,
      blurhashX: image.blurhashX ?? 4,
      blurhashY: image.blurhashY ?? 4,
    }
  }

  private joinPath (dir: string | undefined, file: string): string {
    return path.join(this.relativeDir, dir ?? '', file)
  }
}

const loadConfiguration = async (): Promise<{ config: Configuration, relativeDir: string }> => {
  try {
    const cwd = process.cwd()

    const configFile = await walkBackPath(cwd, CONFIG_FILE)
    const config = await loadData(configFile, { transform: Configuration, validate: true })

    const relativeDir = path.relative(cwd, path.dirname(configFile))

    return { relativeDir, config }
  } catch (err) {
    if (err instanceof ValidationError) {
      throw new ValidationError('Configuration is invalid', err.validationErrors)
    }

    throw new Error(`Failed to load configuration: ${stringifyError(err)}`)
  }
}

let configSingleton: Config | null = null

export const getConfig = async (): Promise<Config> => {
  if (!configSingleton) {
    const { config, relativeDir } = await loadConfiguration()
    configSingleton = new Config(config, relativeDir)
  }

  return configSingleton
}

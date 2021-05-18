import { default as path } from 'path';
import { getLogger, LoggerOptions } from './logger';
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
  Contains,
} from 'class-validator';
import { Type } from 'class-transformer';
import { stringifyError } from './core/error';
import { loadData } from './core/data';

const CONFIG_FILE = 'config.toml';

class DirectoryConfig {
  @IsOptional()
  @IsString()
  public dir?: string;
}

class CacheConfig extends DirectoryConfig {
  @IsNotEmpty()
  @IsString()
  bggIdFile!: string;
}

class DataConfig extends DirectoryConfig {
  @IsNotEmpty()
  @IsString()
  gamesFile!: string;
}

class SourceConfig extends DirectoryConfig {
  @IsNotEmpty()
  @IsString()
  gamesFile!: string;
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
  @IsNotEmpty()
  @IsString()
  @Contains('{name}')
  @Contains('{id}')
  @Contains('{type}')
  namePattern!: string;

  @ValidateNested()
  @Type(() => ImageSize)
  thumbnail!: ImageSize;

  @ValidateNested()
  @Type(() => ImageSize)
  fullsize!: ImageSize;
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
  @Type(() => CacheConfig)
  cache!: CacheConfig;

  @ValidateNested()
  @Type(() => DataConfig)
  data!: DataConfig;

  @ValidateNested()
  @Type(() => SourceConfig)
  source!: SourceConfig;

  @ValidateNested()
  @Type(() => ApiConfig)
  api!: ApiConfig;

  @ValidateNested()
  @Type(() => ImageConfig)
  image!: ImageConfig;
}

const joinPath = (dir: string | undefined, file: string): string =>
  dir ? path.join(dir, file) : file;

export class Config {
  constructor(
    private readonly configuration: Configuration,
    private readonly loggerOptions?: LoggerOptions,
  ) {}

  public getLogger(name: string, options?: LoggerOptions) {
    return getLogger(name, {...this.loggerOptions, ...options});
  }

  public get cache() {
    const { cache } = this.configuration;
    return {
      buildPath: (fileName: string) => joinPath(cache.dir, fileName),
      bggIdFile: joinPath(cache.dir, cache.bggIdFile),
    };
  };

  public get data() {
    const { data } = this.configuration;
    return {
      gamesFile: joinPath(data.dir, data.gamesFile),
    };
  };

  public get source() {
    const { source } = this.configuration;
    return {
      gamesFile: joinPath(source.dir, source.gamesFile),
    };
  };

  public get api() {
    const { api = {} } = this.configuration;
    return {
      timeout: api.timeout ?? 5000,
      root: api.root ?? 'https://boardgamegeek.com/xmlapi2',
      resetTimeout: api.resetTimeout ?? true,
      retries: api.retries ?? 5,
      baseRetry: api.baseRetry ?? 1000,
    }
  }

  public get image() {
    const { image } = this.configuration;
    return {
      buildPath: (fileName: string) => joinPath(image.dir, fileName),
      fullsize: image.fullsize,
      namePattern: image.namePattern,
      thumbnail: image.thumbnail,
    }
  }
}

const loadConfiguration = async (): Promise<Configuration> => {
  try {
    return await loadData(CONFIG_FILE, { transform: Configuration, validate: true });
  } catch (err) {
    throw new Error(`Failed to load configuration: ${stringifyError(err)}`);
  }
}

let configSingleton: Config | null = null;

export const getConfig = async (loggerOptions?: LoggerOptions): Promise<Config> => {
  const logger = getLogger('config', loggerOptions);

  if (!configSingleton) {
    logger.debug('Initializing');

    const configuration = await loadConfiguration();
    configSingleton = new Config(configuration, loggerOptions);
  }

  return configSingleton;
}

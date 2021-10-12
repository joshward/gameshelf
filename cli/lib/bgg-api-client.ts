import { default as axios, AxiosInstance, AxiosError } from 'axios'
import { default as axiosRetry, isRetryableError, isNetworkError } from 'axios-retry'
import { Logger } from './logger'
import { Config } from './config'

const buildExponentialDelay = (baseRetry: number) =>
  (retryNumber: number) => {
    const delay = Math.pow(2, retryNumber) * baseRetry
    const randomSum = delay * 0.2 * Math.random()
    return delay + randomSum
  }

const toApiBoolean = (value?: boolean): number => value ? 1 : 0

export enum ApiObjectType {
  BOARD_GAME = 'boardgame',
  EXPANSION = 'boardgameexpansion',
}

export interface ApiGetOptions {
  withStats?: boolean,
  withVersions?: boolean,
  types?: ApiObjectType[],
}

const isRateLimitError = (error: AxiosError): boolean => error.response?.status === 429

const createRobustAxiosInstance = (config: Config, logger: Logger): AxiosInstance => {
  const options = config.api

  const instance = axios.create({
    baseURL: options.root,
    timeout: options.timeout,
  })

  axiosRetry(instance, {
    shouldResetTimeout: options.resetTimeout,
    retries: options.retries,
    retryCondition: (error: AxiosError) => {
      if (isRateLimitError(error)) {
        logger.warn('API request rate limited - retrying.')
        return true
      }

      if (isRetryableError(error)) {
        logger.warn('API request failed - retrying.')
        return true
      }

      if (isNetworkError(error)) {
        logger.warn('API request had network error - retrying.')
        return true
      }

      return false
    },
    retryDelay: buildExponentialDelay(options.baseRetry),
  })

  return instance
}

export class BggApiClient {
  private readonly client: AxiosInstance;

  constructor(config: Config, logger: Logger) {
    this.client = createRobustAxiosInstance(config, logger)
  }

  public async search(name: string): Promise<string> {
    const response = await this.client.get('/search', {
      params: {
        query: name,
        type: ApiObjectType.BOARD_GAME,
      },
    })

    if (typeof response?.data !== 'string') {
      throw new Error('Unexpected non string response')
    }

    return response.data
  }

  public async get(
    bggId: number,
    options?: ApiGetOptions,
  ): Promise<string> {
    const response = await this.client.get('/thing', {
      params: {
        id: bggId,
        versions: toApiBoolean(options?.withVersions),
        stats: toApiBoolean(options?.withStats),
        type: (options?.types || [ApiObjectType.BOARD_GAME, ApiObjectType.EXPANSION]).join(','),
      }
    })

    if (typeof response?.data !== 'string') {
      throw new Error('Unexpected non string response')
    }

    return response.data
  }
}

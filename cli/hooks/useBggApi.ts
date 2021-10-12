import { useMemo } from 'react'
import { BggApi } from '../lib/bgg-api'
import { Logger } from '../lib/logger'
import { useConfig } from './useConfig'

export default function useBggApi (logger: Logger): BggApi {
  const config = useConfig()
  const bggApi = useMemo(() =>
    new BggApi(config, logger),
  [config, logger])

  return bggApi
}

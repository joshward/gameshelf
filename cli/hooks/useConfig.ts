import React, { useContext } from 'react'
import { Config } from '../lib/config'

export const ConfigContext = React.createContext<Config | null>(null)

export const useConfig = (): Config => {
  const config = useContext(ConfigContext)

  if (!config) {
    throw new Error('Use config called while config not loaded')
  }

  return config
}

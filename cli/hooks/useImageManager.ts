import { useMemo } from 'react'
import { ImageManager } from '../lib/image-manager'
import { useConfig } from './useConfig'

export default function useImageManager (): ImageManager {
  const config = useConfig()
  const imageManager = useMemo(() =>
    new ImageManager(config),
  [config])

  return imageManager
}

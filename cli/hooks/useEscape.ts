import { useInput } from 'ink'

export default function useEscape (onEscape: () => void, isEnabled = true): void {
  useInput((_, key) => {
    if (key.escape) {
      setTimeout(onEscape, 0) // let other useInput handlers process first
    }
  }, { isActive: isEnabled })
}

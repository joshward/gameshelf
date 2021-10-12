import StackTracey, { Entry } from 'stacktracey'
import { safeGetValue } from './utils'

class TsNodeStackTracey extends StackTracey {
  isThirdParty (path: string): boolean {
    if (super.isThirdParty(path)) {
      return true
    }

    return path.startsWith('internal/modules')
  }
}

export function getStackTrace (error: Error): Entry[] {
  return new TsNodeStackTracey(error).clean().items
}

export const stringifyError = (error: unknown): string => {
  return `${safeGetValue(error, 'message') || error}`
}

import { useCallback, useMemo, useState } from 'react'
import { Logger, LogMessage } from '../lib/logger'

export const useLogger = (): { logger: Logger, logs: LogMessage[], clearLogs: () => void } => {
  const [logs, setLogs] = useState<LogMessage[]>([])

  const logger = useMemo<Logger>(() => ({
    debug: (text: string) => setLogs(logs => [...logs, { type: 'Debug', text }]),
    info: (text: string) => setLogs(logs => [...logs, { type: 'Info', text }]),
    success: (text: string) => setLogs(logs => [...logs, { type: 'Success', text }]),
    warn: (text: string) => setLogs(logs => [...logs, { type: 'Warn', text }]),
    fail: (text: string) => setLogs(logs => [...logs, { type: 'Fail', text }]),
  }),
  [setLogs])

  const clearLogs = useCallback(() => setLogs([]), [setLogs])

  return {
    logger,
    logs,
    clearLogs,
  }
}

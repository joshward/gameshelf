import React from 'react'
import { Box, Text } from 'ink'
import { getStackTrace } from '../lib/core/error'
import { ValidationError } from '../lib/core/data'

const ErrorDisplay: React.VFC<{ error: Error | undefined }> = ({ error }) => {
  if (!error) {
    return null
  }

  const message = error.message
  const stackTrace = getStackTrace(error)

  return (
    <Box flexDirection="column">
      <Text color="red">
        {message}
      </Text>
      {error instanceof ValidationError && error.validationErrors.map((issue, index) =>
        <Box marginLeft={2} key={index}>
          <Text color="redBright">
              • { issue.target } - { issue.issue }
          </Text>
        </Box>
      )}
      {stackTrace.map((item, index) =>
        <Box marginLeft={2} key={index}>
          <Box width="30%" alignItems="flex-end" flexDirection="column">
            <Text wrap="truncate-end" color="red" dimColor>
              {item.calleeShort}
            </Text>
          </Box>
          <Box width="20%" paddingLeft={2}>
            <Text wrap="truncate-start" color="red" dimColor>
              {item.fileShort && <>
                {item.fileShort} : {item.line}
              </>}
            </Text>
          </Box>
          <Box width="40%" paddingLeft={2}>
            <Text wrap="truncate-end" color="red" dimColor>
              {(item.sourceLine || '').trim() || ''}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default ErrorDisplay

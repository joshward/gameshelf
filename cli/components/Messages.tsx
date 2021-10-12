import React from 'react'
import { Box, Text } from 'ink'
import { ForegroundColor } from 'chalk'
import { toArray } from '../lib/core/utils'
import { LogType } from '../lib/logger'

interface LogStyle {
  color: typeof ForegroundColor;
  backgroundColor?: typeof ForegroundColor;
  dimColor?: boolean
}

const LogStyles: Map<LogType, LogStyle> = new Map([
  ['Debug', { color: 'grey', dimColor: true }],
  ['Info', { color: 'grey' }],
  ['Success', { color: 'green' }],
  ['Warn', { color: 'yellow' }],
  ['Fail', { color: 'red' }],
])

export interface Message {
  text: string;
  type?: LogType;
}

interface IMessagesProps {
  messages?: string | Message | Array<string | Message>
}

const Messages: React.VFC<IMessagesProps> = (props) => {
  const {
    messages
  } = props

  const normalizedMessages = toArray(messages)
    .map(message => typeof message === 'string'
      ? { text: message }
      : message
    )

  if (normalizedMessages.length === 0) {
    return null
  }

  return (
    <Box marginY={1} justifyContent="center">
      <Box flexDirection='column'>
        {normalizedMessages.map((message, index) =>
          <Box key={index}>
            <Text
              {...LogStyles.get(message.type ?? 'Info')}
            >
              {message.text}
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default Messages

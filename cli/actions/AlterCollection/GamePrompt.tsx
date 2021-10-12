import React, { useState } from 'react'
import { Text, Box } from 'ink'
import TextInput from 'ink-text-input'

interface IGamePromptProps {
  message: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
}

const GamePrompt: React.VFC<IGamePromptProps> = (props) => {
  const {
    message,
    placeholder,
    onSubmit
  } = props

  const [query, setQuery] = useState('')

  const handleSubmit = () => {
    onSubmit(query?.trim() ?? '')
  }

  return (
    <Box>
      <Box marginRight={2}>
        <Text bold={true} color="green">
          {message}
        </Text>
      </Box>

      <TextInput
        placeholder={placeholder}
        value={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}

export default GamePrompt

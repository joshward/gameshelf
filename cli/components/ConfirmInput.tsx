import React, { useMemo, useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import { yn } from '../lib/matchers'

interface ConfirmInputProps {
  message: string;
  autoSubmit?: boolean;
  defaultValue?: boolean;
  showHint?: boolean;
  onSubmit: (value: boolean | undefined) => void;
}

const ConfirmInput: React.VFC<ConfirmInputProps> = (props) => {
  const {
    message,
    autoSubmit,
    defaultValue,
    showHint,
    onSubmit,
  } = props

  const [value, setValue] = useState('')

  const hint = useMemo(() => {
    if (!showHint) {
      return ''
    }

    const yes = defaultValue === true ? 'Y' : 'y'
    const no = defaultValue === false ? 'N' : 'n'

    return `(${yes}/${no})`
  }, [showHint, defaultValue])

  const handleSubmit = (newValue: string) => {
    onSubmit(yn(newValue, { default: defaultValue }))
  }

  const handleChange = (newValue: string) => {
    setValue(newValue)

    if (autoSubmit) {
      const autoChoice = yn(newValue)

      if (autoChoice !== undefined) {
        onSubmit(autoChoice)
      }
    }
  }

  return (
    <Box>
      <Box marginRight={2}>
        <Text bold color="green">
          {message} {hint}
        </Text>
      </Box>

      <TextInput
        value={value}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </Box>
  )
}

export default ConfirmInput

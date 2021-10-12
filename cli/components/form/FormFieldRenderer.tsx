import { Box, Text, useFocus, useInput } from 'ink'
import React, { useState } from 'react'
import { DescriptionRenderer } from './DescriptionRenderer'
import { FormInput, FormObject } from './types'

interface FormFieldRendererProps<T extends FormObject, K extends keyof T> {
  prop: keyof T;
  input: FormInput<T[K]>;
  value: T[K];
  onChange: (next: T[K]) => void;
  onSetEditingField: (key: keyof T | undefined) => void;
  editingField: keyof T | undefined;
}

export const FormFieldRenderer = <T extends FormObject, K extends keyof T>(props: FormFieldRendererProps<T, K>): JSX.Element | null => {
  const {
    prop,
    input,
    value,
    onChange,
    onSetEditingField,
    editingField,
  } = props

  const [error, setError] = useState<string>()
  const [currentValue, setCurrentValue] = useState<T[K]>(value)

  const { isFocused } = useFocus({})

  const isEditing = editingField === prop
  const hide = !isEditing && editingField != undefined

  const save = () => {
    if (error) {
      return
    }

    onChange(currentValue)
    onSetEditingField(undefined)
  }

  const cancel = () => {
    setCurrentValue(value)
    setError(undefined)
    onSetEditingField(undefined)
  }

  useInput(
    (input, key) => {
      if (!isEditing && key.return && !key.ctrl && !key.meta) {
        onSetEditingField(prop)
      } else if (isEditing && key.escape) {
        setTimeout(cancel, 0)
      } else if (isEditing && key.return) {
        setTimeout(save, 0)
      }
    },
    { isActive: isFocused }
  )

  if (hide) {
    return null
  }

  if (!isEditing) {
    const RenderValue = input.valueRenderer
    return (
      <Box marginX={2} paddingX={1} borderStyle="round" borderColor={isFocused ? 'blue' : undefined}>
        <Box flexGrow={1}>
          <Text underline={isFocused} color={isFocused ? 'blue' : undefined}>
            {input.label ?? `${prop}`}
          </Text>
          {input.required && <Text color="red">*</Text>}
          <Text>: </Text>
          <Text dimColor>
            <RenderValue value={value} />
          </Text>
        </Box>
        {isFocused && (
          <Box>
            <Text>Press enter to edit</Text>
          </Box>
        )}
      </Box>
    )
  }

  const RenderComponent = input.componentRenderer
  return (
    <Box paddingX={3} paddingY={1} flexDirection="column">
      <Box>
        <Text>{input.label ?? `${prop}`}</Text>
        {input.required && <Text color="red">*</Text>}
        <Text>: </Text>
      </Box>
      <Box>
        <RenderComponent
          onError={setError}
          onClearError={() => setError(undefined)}
          onChange={setCurrentValue}
          value={currentValue}
          error={error}
        />
      </Box>
      {input.description && (
        <Box>
          <Text dimColor>
            <DescriptionRenderer description={input.description} />
          </Text>
        </Box>
      )}
      {error && (
        <Box>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
      <Box marginTop={2}>
        <Text dimColor>
          {error ? (
            <>Press ESC to cancel.</>
          ) : (
            <>Press Enter to complete field, or ESC to cancel.</>
          )}
        </Text>
      </Box>
    </Box>
  )
}

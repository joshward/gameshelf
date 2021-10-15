import React from 'react'
import { Box } from 'ink'
import TextInput from 'ink-text-input'
import { FormInput, FormInputCommon } from '../types'

interface FormTextInputProps {
  placeholder?: string,
  emptyText?: string,
}

export function FormTextInput(props: FormInputCommon<string> & FormTextInputProps): FormInput<string> {
  return {
    ...props,
    defaultValue: '',
    isValueSet: (value: string) => value !== '',
    valueRenderer: ({ value }): JSX.Element => <>{value || props.emptyText}</>,
    componentRenderer: (rendererProps) => (
      <Box borderStyle={'round'} width="100%">
        <TextInput
          value={rendererProps.value}
          onChange={rendererProps.onChange}
          placeholder={props.placeholder}
        />
      </Box>
    )
  }
}

export function FormOptionalTextInput(props: FormInputCommon<string | undefined> & FormTextInputProps): FormInput<string | undefined> {
  return {
    ...props,
    defaultValue: '',
    isValueSet: (value: string | undefined) => value == undefined || value == '',
    valueRenderer: ({ value }): JSX.Element => <>{value || props.emptyText}</>,
    componentRenderer: (rendererProps) => (
      <Box borderStyle={'round'} width="100%">
        <TextInput
          value={rendererProps.value ?? ''}
          onChange={rendererProps.onChange}
          placeholder={props.placeholder}
        />
      </Box>
    )
  }
}

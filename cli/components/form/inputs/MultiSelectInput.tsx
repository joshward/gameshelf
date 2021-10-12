import React from 'react'
import { Box } from 'ink'
import SelectInput from 'ink-multi-select'
import { FormInput, FormInputCommon } from '../types'

interface MultiSelectInput {
  options: { label?: string; value: string }[];
}

export function MultiSelectInput(props: FormInputCommon<string[]> & MultiSelectInput): FormInput<string[]> {
  return {
    ...props,
    defaultValue: [],
    isValueSet: (value: string[]) => value?.length > 0,
    valueRenderer: ({ value }) => (
      <>
        {props.options
          .filter(option => value.includes(option.value))
          .map(option => option.label ?? option.value)
          .join(', ') || ''}
      </>
    ),
    componentRenderer: (rendererProps) => (
      <Box borderStyle={'round'} width="100%">
        <SelectInput
          items={props.options.map(option => ({ value: option.value, label: option.label ?? option.value }))}
          onSelect={option => rendererProps.onChange([...rendererProps.value, `${option.value}`])}
          onUnselect={option => rendererProps.onChange(rendererProps.value.filter(value => value !== `${option.value}`))}
          defaultSelected={props.options.filter(option => rendererProps.value.includes(option.value))}
        />
      </Box>
    )
  }
}

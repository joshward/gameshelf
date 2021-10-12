import React from 'react'
import { Box, Text } from 'ink'
import { FormInput } from '../../components/form/types'
import LimitMultiSelect from '../../components/LimitMultiSelect'
import { BggGameWithVersions } from '../../lib/bgg-api'

interface GameExpansionInputProps {
  initialValue: number[];
  game: BggGameWithVersions;
}

export default function GameExpansionInput(props: GameExpansionInputProps): FormInput<number[]> {
  const expansions = props.game.expansionLinks
  const expansionOptions = expansions.map(option => ({ value: option.expansionId, label: option.name }))

  return {
    ...props,
    label: 'Game Expansions',
    defaultValue: [],
    isValueSet: (value: number[]) => value?.length > 0,
    valueRenderer: ({ value }) => {
      if (expansions.length === 0) {
        return <Text color="gray">No Expansions</Text>
      }

      return <>{`${value.length} of ${expansions.length} Selected`}</>
    },
    componentRenderer: (rendererProps) => (
      <Box borderStyle={'round'} width="100%">
        <LimitMultiSelect
          limit={10}
          items={expansionOptions}
          onSelect={option => rendererProps.onChange([...rendererProps.value, option.value as number])}
          onUnselect={option => rendererProps.onChange(rendererProps.value.filter(value => value !== option.value))}
          defaultSelected={expansionOptions.filter(option => rendererProps.value.includes(option.value))}
        />
      </Box>
    )
  }
}

import React from 'react'
import { Box, Text } from 'ink'
import MultiSelect, { MultiSelectProps } from 'ink-multi-select'

const Indicator: React.VFC = () => {
  return (
    <Box width="100%" justifyContent="center">
      <Text color="blue">...</Text>
    </Box>
  )
}

const LimitMultiSelect: React.VFC<MultiSelectProps> = (props) => {
  const { limit, items } = props

  const showIndicators = limit && items ? limit < items?.length : false

  return (
    <Box flexDirection="column">
      {showIndicators && <Indicator />}
      <MultiSelect {...props} />
      {showIndicators && <Indicator />}
    </Box>
  )
}

export default LimitMultiSelect

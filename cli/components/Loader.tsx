import React from 'react'
import { Text, Box } from 'ink'
import Spinner from 'ink-spinner'

const Loader: React.VFC<{ message?: string }> = ({ message }) => {
  return (
    <Box>
      <Box marginRight={1}>
        <Text color="green">
          <Spinner type="dots4" />
        </Text>
      </Box>

      <Text>
        { message ?? 'Loading' }
      </Text>
    </Box>
  )
}

export default Loader

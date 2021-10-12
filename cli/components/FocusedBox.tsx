import React from 'react'
import { Box, BoxProps } from 'ink'

const FocusedBox: React.FC<BoxProps> = ({ children, ...boxProps }) => {
  return (
    <Box
      borderStyle="round"
      borderColor="blueBright"
      padding={1}
      {...boxProps}
    >
      {children}
    </Box>
  )
}

export default FocusedBox

import React from 'react'
import { Box } from 'ink'
import Gradient from 'ink-gradient'

const Header: React.FC = (props) => {
  return (
    <Box borderStyle="double" justifyContent="center">
      <Gradient name="pastel">
        {props.children}
      </Gradient>
    </Box>
  )
}

export default Header

import React, { useMemo } from 'react'
import he from 'he'
import { Box, Text } from 'ink'
import Link from 'ink-link'
import { BggGame } from '../../lib/bgg-api'
import { collapseWhiteSpace } from '../../lib/core/utils'

const GamePreview: React.VFC<{ game: BggGame, id: number, inCollection: boolean }> = ({ game, id, inCollection }) => {

  const description = useMemo(() => {
    const decoded = he.decode(game.description)
    return collapseWhiteSpace(decoded).trim()
  }, [game.description])

  return (
    <Box flexDirection="column" borderColor="grey" borderStyle="single" padding={1}>

      <Box width="100%" alignItems="center">
        <Link url={`https://www.boardgamegeek.com/boardgame/${id}`}>
          { game.name }
        </Link>
      </Box>

      <Box marginY={1} flexDirection="row" justifyContent="space-around">

        <Box flexDirection="column" alignItems="center">
          <Text bold color="grey">
            Published Year
          </Text>
          <Text color="white">
            {game.publishedYear}
          </Text>
        </Box>

        <Box flexDirection="column" alignItems="center">
          <Text bold color="grey">
            Publisher
          </Text>
          <Text color="white">
            {game.publisher}
          </Text>
        </Box>

        <Box flexDirection="column" alignItems="center">
          <Text bold color="grey">
            Designers
          </Text>
          <Box flexDirection="column">
            {game.designers.map(designer =>
              <Text color="white" key={designer}>
                {designer}
              </Text>
            )}
          </Box>
        </Box>

      </Box>

      <Text wrap="truncate-end">
        { description }
      </Text>

      <Box flexDirection="row" marginTop={1} justifyContent="space-around">
        <Text color={game.type === 'boardgame' ? 'gray' : 'red'}>
          Type: { game.type ?? 'unknown' }
        </Text>

        <Text color={inCollection ? 'green' : 'yellow'}>
          { inCollection ? 'In collection' : 'Not in collection' }
        </Text>
      </Box>
    </Box>
  )
}

export default GamePreview

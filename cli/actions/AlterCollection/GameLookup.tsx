import React from 'react'
import useStateMachine, { t } from '@cassiozen/usestatemachine'
import { Box, useInput, Text } from 'ink'
import useEscape from '../../hooks/useEscape'
import { useGameList } from '../../hooks/useGameList'
import { useLogger } from '../../hooks/useLogger'
import ErrorDisplay from '../../components/ErrorDisplay'
import FocusedBox from '../../components/FocusedBox'
import GamePreview from './GamePreview'
import GamePrompt from './GamePrompt'
import Loader from '../../components/Loader'
import Messages, { Message } from '../../components/Messages'
import { asInt, getSet, valueIn as isValueIn, wrap } from '../../lib/core/utils'
import { BggGameWithVersions } from '../../lib/bgg-api'
import { matchUrl } from '../../lib/matchers'
import useBggApi from '../../hooks/useBggApi'
import { FoundGame } from './types'

interface GameInfo {
  details?: BggGameWithVersions;
  bggId: number;
}

interface GameLookupProps {
  onFound: (game: FoundGame) => void;
  onCancel: () => void;
  setMessage: (messages: Message[]) => void;
}

const GameLookup: React.VFC<GameLookupProps> = (props) => {
  const {
    onFound,
    onCancel,
    setMessage,
  } = props

  const gameList = useGameList()
  const { logs, logger, clearLogs } = useLogger()
  const bggApi = useBggApi(logger)

  const [state, send] = useStateMachine({
    schema: {
      context: t<{ error?: Error, games?: GameInfo[], index?: number }>(),
      events: {
        SUBMIT: t<{ value: string }>(),
        FETCH_DETAILS: t<{ index: number }>(),
        SEARCH: t<{ value: string }>(),
        ERROR: t<{ error: string | Error }>(),
      }
    },
    context: {},
    initial: 'prompting',
    states: {

      prompting: {
        on: {
          CANCEL: 'quitting',
          SUBMIT: 'submittingPrompt',
        },
      },

      erroring: {
        on: {
          PROMPT: 'prompting',
        },
        effect({ setContext, send, event }) {
          const error = event?.error

          if (error instanceof Error)
          {
            setContext(context => ({ ...context, error }))
          }
          else
          {
            setMessage([{ text: error, type: 'Fail' }])
          }

          send('PROMPT')
        }
      },

      quitting: {
        effect() {
          onCancel()
        }
      },

      submittingPrompt: {
        on: {
          FETCH_DETAILS: 'fetchingDetails',
          SEARCH: 'searching',
        },
        effect({ event, send, setContext }) {
          setContext(() => ({})) // clear error

          const value = event.value

          const message = { text: `Finding: ${value}` }

          let bggId = asInt(value)
          if (bggId != null) {
            const id = bggId
            setMessage([message, { text: 'Detecting as BGG ID' }])
            setContext(() => ({ games: [{ bggId: id }] }))
            send({ type: 'FETCH_DETAILS', index: 0 })
            return
          }

          bggId = matchUrl(value)
          if (bggId != undefined) {
            const id = bggId
            setMessage([message, { text: `Detecting as URL (${bggId})` }])
            setContext(() => ({ games: [{ bggId: id }] }))
            send({ type: 'FETCH_DETAILS', index: 0})
            return
          }

          setMessage([message, { text: 'Detecting as game name' }])
          send({ type: 'SEARCH', value })
        }
      },

      fetchingDetails: {
        on: {
          ERROR: 'erroring',
          SHOW_GAME: 'displayingGame',
        },
        effect({ send, context, setContext, event }) {
          const gameCount = getSet(context.games).length
          const index = wrap(event.index, gameCount)
          setContext(context => ({ index, games: context.games }))
          const currentSelection = getSet(context.games)[getSet(index)]

          if (gameCount > 1) {
            setMessage([{ text: `Showing ${index + 1} of ${gameCount}` }])
          }
          else {
            setMessage([])
          }

          if (currentSelection.details) {
            send('SHOW_GAME')
            return
          }

          clearLogs()

          bggApi.getGame(currentSelection.bggId)
            .then((details) => {
              clearLogs()

              if (!details) {
                send({ type: 'ERROR', error: 'Failed to load game' })
                return
              }

              currentSelection.details = details
              send('SHOW_GAME')
            })
            .catch((error) => send({ type: 'ERROR', error }))
        }
      },

      cancelingAdd: {
        on: {
          PROMPT: 'prompting'
        },
        effect({ send }) {
          setMessage([{ text: 'Canceled', type: 'Warn' }])
          send('PROMPT')
        }
      },

      searching: {
        on: {
          CANCEL: 'cancelingAdd',
          FETCH_DETAILS: 'fetchingDetails',
          NO_RESULTS: 'prompting'
        },
        effect({ event, setContext, send }) {
          clearLogs()

          const existingMatches = gameList.search(event.value)

          bggApi.search(event.value)
            .then((matches) => {
              const existingIds = existingMatches.map(match => match.bggId)
              const apiIds = matches.map(match => match.id)
              const ids = existingIds.concat(apiIds.filter(id => !existingIds.includes(id)))

              if (ids.length === 0) {
                setMessage([{ text: 'No matches', type: 'Fail' }])
                send('NO_RESULTS')
                return
              }

              setContext(() => ({ games: ids.map(bggId => ({ bggId })) }))
              send({ type: 'FETCH_DETAILS', index: 0 })
            })
            .catch((error) => send({ type: 'ERROR', error }))
        }
      },

      displayingGame: {
        on: {
          CANCEL: 'cancelingAdd',
          FETCH_DETAILS: 'fetchingDetails',
        },
      },
    }
  })

  useEscape(() => send('CANCEL'), isValueIn<typeof state.value>(state.value, 'prompting', 'searching'))

  useInput((input, key) => {
    const hasMultiple = (state.context.games?.length ?? 0) > 1
    const currentIndex = state.context.index ?? 0
    const currentGame = getSet(state.context.games)[currentIndex]
    const gameInCollection = gameList.hasGame(currentGame.bggId)

    if (hasMultiple && key.leftArrow) {
      send({ type: 'FETCH_DETAILS', index: currentIndex - 1 })
    }
    else if (hasMultiple && key.rightArrow) {
      send({ type: 'FETCH_DETAILS', index: currentIndex + 1 })
    }
    else if (key.return) {
      onFound({
        ...currentGameDetails,
        inCollection: gameInCollection,
      })
    }
    else if (key.escape) {
      send('CANCEL')
    }
  }, { isActive: state.value === 'displayingGame' })

  if (state.value === 'prompting') {
    return (
      <Box flexDirection="column" width="100%">
        <ErrorDisplay error={state.context.error} />

        {state.value === 'prompting' &&
          <FocusedBox>
            <GamePrompt
              message="Enter game to add:"
              placeholder="(URL | BGG ID | Name)"
              onSubmit={value => send({ type: 'SUBMIT', value })}
            />
          </FocusedBox>
        }
      </Box>
    )
  }

  if (state.value === 'fetchingDetails') {
    return <>
      <Messages messages={logs} />
      <Loader message="Fetching Game" />
    </>
  }

  if (state.value === 'searching') {
    return <Loader message="Searching for Game" />
  }

  if (state.value !== 'displayingGame') {
    return null
  }

  const index = getSet(state.context.index)
  const currentGameInfo = getSet(state.context.games)[index]
  const currentGameDetails = {
    bggId: currentGameInfo.bggId,
    details: getSet(currentGameInfo.details)
  }
  const gameInCollection = gameList.hasGame(currentGameDetails.bggId)
  const hasMultiple = getSet(state.context.games).length > 1

  return <>
    <GamePreview
      game={currentGameDetails.details}
      id={currentGameDetails.bggId}
      inCollection={gameInCollection}
    />

    <FocusedBox
      flexDirection="column"
      alignItems="center"
    >
      <Text>
        ESC to cancel. ENTER to select game.
        {hasMultiple && ' LEFT and RIGHT to view other options.'}
      </Text>
    </FocusedBox>
  </>
}

export default GameLookup

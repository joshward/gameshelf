import useStateMachine, { t } from '@cassiozen/usestatemachine'
import React, { useState } from 'react'
import { Box } from 'ink'
import ErrorDisplay from '../../components/ErrorDisplay'
import Loader from '../../components/Loader'
import Messages, { Message } from '../../components/Messages'
import { useGameList } from '../../hooks/useGameList'
import { getSet } from '../../lib/core/utils'
import AlterActionSelector from './AlterActionSelector'
import GameLookup from './GameLookup'
import GamePreview from './GamePreview'
import { buildFormData, FoundGame, GameFormData, saveGame } from '../../lib/types'
import GameForm from './GameForm'
import { chunkBggName } from '../../lib/processor'
import useImageManager from '../../hooks/useImageManager'
import { useLogger } from '../../hooks/useLogger'
import useBggApi from '../../hooks/useBggApi'

interface AlterCollectionProps {
  onDone: () => void
}

const AlterCollection: React.VFC<AlterCollectionProps> = (props) => {
  const {
    onDone,
  } = props

  const gameList = useGameList()
  const imageManager = useImageManager()
  const { logs, logger, clearLogs } = useLogger()
  const bggApi = useBggApi(logger)
  const [messages, setMessages] = useState<Message[]>()

  const [state, send] = useStateMachine({
    schema: {
      context: t<{ game?: FoundGame, error?: Error, formData?: GameFormData }>(),
      events: {
        ALTER_GAME: t<{ game: FoundGame }>(),
        COMPLETE: t<{ message: string }>(),
        ERROR: t<{ error: Error }>(),
        CUSTOMIZE: t<{ formData: GameFormData }>(),
        SAVE: t<{ formData: GameFormData }>(),
      }
    },
    context: {},
    initial: 'findingGame',
    states: {

      findingGame: {
        on: {
          CANCEL: 'quitting',
          ALTER_GAME: 'alteringGame',
        },
        effect({ event, setContext }) {

          if (event.type === 'ERROR') {
            setContext(() => ({ error: event.error }))
          } else {
            setContext(() => ({}))
          }

          if (event.type === 'COMPLETE') {
            setMessages([{ text: event.message, type: 'Success' }])
          } else {
            setMessages(undefined)
          }
        }
      },

      quitting: {
        effect() {
          onDone()
        }
      },

      alteringGame: {
        on: {
          CANCEL: 'findingGame',
          REMOVE: 'removingGame',
          ADD_GAME: 'addingGame',
          EDIT_GAME: 'editingGame',
        },
        effect({ event, setContext }) {
          setMessages([ { text: 'Selected', type: 'Success' } ])
          setContext(() => ({ game: event.game }))
        }
      },

      addingGame: {
        on: {
          CUSTOMIZE: 'customizingGame',
        },
        effect({ context, send }) {
          const game = getSet(context.game)

          const nameParts = chunkBggName(game.details.name)
          const formData: GameFormData = {
            name: nameParts.name,
            subTitle: nameParts.subTitle ?? '',
            editionTitle: nameParts.editionTitle ?? '',
            addedDate: undefined,
            tags: [],
            versionId: undefined,
            expansionsIds: [],
          }

          send({ type: 'CUSTOMIZE', formData })
        }
      },

      editingGame: {
        on: {
          CUSTOMIZE: 'customizingGame',
        },
        effect({ context, send }) {
          const game = getSet(context.game)
          const gameListData = gameList.getGame(game.bggId)
          const formData = buildFormData(gameListData)

          send({ type: 'CUSTOMIZE', formData })
        }
      },

      customizingGame: {
        on: {
          CANCEL: 'findingGame',
          SAVE: 'savingGame',
        },
        effect({ event, context, setContext }) {
          const game = getSet(context.game)

          setMessages([ { text: `Edit ${game.details.name}`, type: 'Success' } ])
          setContext(current => ({ ...current, formData: event.formData }))
        }
      },

      removingGame: {
        on: {
          COMPLETE: 'findingGame',
          ERROR: 'findingGame'
        },
        effect({ send, context }) {
          const game = getSet(context.game)

          setMessages([{ text: `Removing ${game.details.name}`, type: 'Info' }])

          const removeGame = async () => {
            await gameList.removeGame(game.bggId)
            await imageManager.deleteImages(game.bggId)
          }

          removeGame()
            .then(() => {
              send({ type: 'COMPLETE', message: `${game.details.name} Removed` })
            })
            .catch((error: Error) => {
              send({ type: 'ERROR', error })
            })
        }
      },

      savingGame: {
        on: {
          COMPLETE: 'findingGame',
          ERROR: 'findingGame',
        },
        effect({ event, context, send }) {
          const game = getSet(context.game)
          const formData = event.formData
          clearLogs()

          saveGame(
            game.bggId,
            game.details,
            formData,
            bggApi,
            imageManager,
            gameList,
          )
            .then(() => { send({ type: 'COMPLETE', message: `${formData.name} ${game.inCollection ? 'Updated' : 'Added'}` }) })
            .catch((error: Error) => send({ type: 'ERROR', error }))
        }
      }
    }
  })

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Messages messages={messages} />

      <ErrorDisplay error={state.context.error}/>

      {state.value === 'findingGame' &&
        <GameLookup
          setMessage={setMessages}
          onCancel={() => send('CANCEL')}
          onFound={game => send({ game, type: 'ALTER_GAME' })}
        />
      }

      {state.value === 'alteringGame' && state.context.game &&
        <>
          <GamePreview
            game={state.context.game.details}
            id={state.context.game.bggId}
            inCollection={state.context.game.inCollection}
          />

          <AlterActionSelector
            isInCollection={state.context.game.inCollection}
            onAdd={() => send('ADD_GAME')}
            onEdit={() => send('EDIT_GAME')}
            onRemove={() => send('REMOVE')}
            onCancel={() => send('CANCEL')}
          />
        </>
      }

      {state.value === 'removingGame' &&
        <Loader message="Removing Game" />
      }

      {state.value === 'customizingGame' && state.context.formData && state.context.game &&
        <GameForm
          data={state.context.formData}
          game={state.context.game.details}
          onCancel={() => send('CANCEL')}
          onSubmit={formData => send({ type: 'SAVE', formData })}
        />
      }

      {state.value === 'savingGame' &&
        <>
          <Messages messages={logs} />
          <Loader message="Saving Changes"/>
        </>
      }

    </Box>
  )
}

export default AlterCollection


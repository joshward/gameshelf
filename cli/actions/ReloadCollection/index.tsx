import useStateMachine, { t } from '@cassiozen/usestatemachine'
import React from 'react'
import { Box } from 'ink'
import ConfirmInput from '../../components/ConfirmInput'
import FocusedBox from '../../components/FocusedBox'
import Loader from '../../components/Loader'
import Messages from '../../components/Messages'
import useBggApi from '../../hooks/useBggApi'
import { useGameList } from '../../hooks/useGameList'
import useImageManager from '../../hooks/useImageManager'
import { useLogger } from '../../hooks/useLogger'
import { LogMessage } from '../../lib/logger'
import { buildFormData, saveGame } from '../../lib/types'

interface ReloadCollectionProps {
  onDone: () => void;
}

const ReloadCollection: React.VFC<ReloadCollectionProps> = ({ onDone }) => {

  const imageManager = useImageManager()
  const gameList = useGameList()
  const { logs, logger, clearLogs } = useLogger()
  const bggApi = useBggApi(logger)

  const [state, send] = useStateMachine({
    schema: {
      context: t<{ bggIds: number[], messages: LogMessage[], currentAction?: string }>(),
      events: {
        PROMPT: t<{ bggIds: number[] }>()
      }
    },
    context: { bggIds: [], messages: [] },
    initial: 'loadingInitialList',
    states: {

      loadingInitialList: {
        on: {
          PROMPT: 'prompting',
        },
        effect({ send }) {
          send({ type: 'PROMPT', bggIds: gameList.getAllGameIds() })
        }
      },

      prompting: {
        on: {
          PROCESS: 'processing',
          DONE: 'quitting',
        },
        effect({ setContext, event }) {
          setContext(context => ({ ...context, bggIds: event.bggIds }))
        }
      },

      processing: {
        on: {
          PROMPT: 'prompting',
          DONE: 'quitting',
        },
        effect({ send, context, setContext }) {
          setContext(context => ({ ...context, messages: [], currentAction: undefined }))

          const processGame = async (bggId: number, index: number, count: number): Promise<void> => {
            clearLogs()

            const game = gameList.getGame(bggId)
            setContext(context => ({ ...context, currentAction: `Loading game ${game.name} (${index + 1} of ${count})` }))
            const formData = buildFormData(game)
            const foundGame = await bggApi.getGame(bggId)

            if (!foundGame) {
              throw new Error(`Game not found in API call ${game.name} (${bggId})`)
            }

            await saveGame(
              bggId,
              foundGame,
              formData,
              bggApi,
              imageManager,
              gameList,
            )
          }

          const processAllGames = async (): Promise<number[]> => {
            const failedGames: number[] = []

            let index = 0
            for (const gameId of context.bggIds) {
              try {
                await processGame(gameId, index, context.bggIds.length)
                index += 1
              } catch (error: unknown) {
                failedGames.push(gameId)
                setContext(context => ({
                  ...context,
                  messages: [...context.messages, { type: 'Fail', text: `${error}` }]
                }))
              }
            }

            return failedGames
          }

          processAllGames().then(
            (failedGames) => {
              if (failedGames.length > 0) {
                send({ type: 'PROMPT', bggIds: failedGames })
                return
              }

              send('DONE')
            }
          )
        }
      },

      quitting: {
        effect() {
          onDone()
        }
      }
    }
  })

  const handlePrompt = (value?: boolean): void => {
    if (value === false) {
      send('DONE')
    }

    send('PROCESS')
  }

  if (state.value === 'prompting') {
    return (
      <FocusedBox>
        <ConfirmInput
          message={`Reload ${state.context.bggIds.length} games?`}
          onSubmit={handlePrompt}
          autoSubmit={true}
          defaultValue={true}
          showHint={true}
        />
      </FocusedBox>
    )
  }

  if (state.value === 'processing') {
    return (
      <Box flexDirection="column">
        <Loader message={state.context.currentAction || 'Reloading games'} />
        <Messages messages={state.context.messages} />
        <Messages messages={logs} />
      </Box>
    )
  }

  return (null)
}

export default ReloadCollection

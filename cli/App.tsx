import React from 'react'
import useStateMachine, {t} from '@cassiozen/usestatemachine'
import { Text, Box, useApp } from 'ink'
import SelectInput from 'ink-select-input'
import { Item } from 'ink-select-input/build/SelectInput'
import AlterCollection from './actions/AlterCollection'
import { ConfigContext } from './hooks/useConfig'
import useEscape from './hooks/useEscape'
import ErrorDisplay from './components/ErrorDisplay'
import FocusedBox from './components/FocusedBox'
import Header from './components/Header'
import Loader from './components/Loader'
import { Config, getConfig } from './lib/config'
import { GameList } from './lib/game-list'
import { GameListContext } from './hooks/useGameList'

const AlterLabel = 'Alter Collection'
const ExitLabel = 'Exit'

type MenuState = 'ALTER' | 'EXIT'

const menuOptions: Item<MenuState>[] = [
  { label: AlterLabel , value: 'ALTER' },
  { label: ExitLabel, value: 'EXIT' }
]

const App: React.VFC = () => {
  const app = useApp()

  const [state, send] = useStateMachine({
    schema: {
      context: t<{
        actionName?: string,
        error?: Error,
        config: Config | null,
        gameList: GameList | null,
      }>(),
      events: {
        ERROR: t<{ error: Error }>(),
      }
    },
    context: { config: null, gameList: null },
    initial: 'initializing',
    states: {
      initializing: {
        on: {
          LOADED: 'altering',
          EXIT: 'exiting',
        },
        effect({ setContext, send }) {
          const load = async (): Promise<void> => {
            const config = await getConfig()
            const gameList = await GameList.LoadGameList(config)

            setContext(context => ({ ...context, config, gameList }))
          }

          load()
            .then(() => {
              send('LOADED')
            })
            .catch((error: Error) => {
              setContext(context => ({ ...context, error }))
              send('EXIT')
            })
        }
      },

      showingMenu: {
        on: {
          ALTER: 'altering',
          EXIT: 'exiting'
        },
        effect({ setContext, event }) {
          if (event.type === 'BACK')
          {
            setContext(context => ({ ...context, actionName: undefined }))
          }

          if (event.type === 'ERROR')
          {
            setContext(context => ({ ...context, error: event?.error, actionName: undefined }))
          }
        }
      },

      altering: {
        on: {
          BACK: 'showingMenu',
          ERROR: 'showingMenu',
        },
        effect({ setContext }) {
          setContext(({ config, gameList }) => ({ actionName: AlterLabel, config, gameList }))
        }
      },

      exiting: {
        effect() {
          app.exit()
        }
      }
    }
  })

  useEscape(() => send('EXIT'), state.value === 'showingMenu')

  const title = state.context.actionName || 'GAMES'

  const selectMenuOption = (option: Item<MenuState>) => {
    send(option.value)
  }

  return (
    <Box flexDirection="column">
      <Header>
        <Text>{title}</Text>
      </Header>

      <ErrorDisplay error={state.context.error}/>

      <Box marginTop={2} marginX={5}>
        {state.value === 'initializing' &&
          <Loader message="Initializing" />
        }

        <ConfigContext.Provider value={state.context.config}>
          <GameListContext.Provider value={state.context.gameList}>
            {state.value === 'showingMenu' &&
              <Box flexGrow={1} flexDirection="column">
                <FocusedBox justifyContent="center">
                  <SelectInput
                    items={menuOptions}
                    onSelect={selectMenuOption}
                  />
                </FocusedBox>
              </Box>
            }

            {state.value === 'altering' &&
              <AlterCollection
                onDone={() => send('BACK')}
              />
            }
          </GameListContext.Provider>
        </ConfigContext.Provider>
      </Box>
    </Box>
  )
}

export default App

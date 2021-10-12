import React, { useContext } from 'react'
import { GameList } from '../lib/game-list'

export const GameListContext = React.createContext<GameList | null>(null)

export const useGameList = (): GameList => {
  const gameList = useContext(GameListContext)

  if (!gameList) {
    throw new Error('Use config called while game list not loaded')
  }

  return gameList
}

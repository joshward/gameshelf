import 'reflect-metadata'
import React from 'react'
import { render } from 'ink'
import App from './App'
import { clearScreen } from './lib/core/output'

console.log(clearScreen)
render(<App />)
  .waitUntilExit()
  .then(() => console.log())

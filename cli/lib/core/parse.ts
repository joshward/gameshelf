import { default as path } from 'path'
import { default as toml } from 'toml'
import { stringifyError } from './error'

export type ParseType = 'TOML' | 'JSON';

export const getParseTypeFromFileName = (fileName: string): ParseType => {
  const extension = path.extname(fileName).toLowerCase()

  if (extension === '.json') {
    return 'JSON'
  }

  if (extension === '.toml') {
    return 'TOML'
  }

  throw new Error(`No parse type known for file extension "${extension}" (${fileName})`)
}

export const parse = (raw: string, type: ParseType): unknown => {
  try {
    if (type === 'TOML') {
      return toml.parse(raw)
    }

    if (type === 'JSON') {
      return JSON.parse(raw)
    }
  } catch (error) {
    throw new Error(`Failed to parse data to ${type}: ${stringifyError(error)}`)
  }

  throw new Error(`Umm 😰... No parser implemented for ${type}`)
}

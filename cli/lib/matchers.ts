import { asInt } from './core/utils'

export function matchUrl(url: string): number | undefined {
  let match = url.match(/^https:\/\/(?:www\.)?boardgamegeek\.com\/boardgame\/(\d+)/)

  if (match?.length == 2) {
    return asInt(match[1])
  }

  match = url.match(/^https:\/\/josh-games.vercel.app\/game\/(\d+)/)

  if (match?.length == 2) {
    return asInt(match[1])
  }

  return undefined
}

// https://github.com/sindresorhus/yn
export function yn(value: string, {	default: default_ }: { default?: boolean } = {}): boolean | undefined {
  if (value == undefined) {
    return default_
  }

  value = String(value).trim()

  if (/^(?:y|yes|true|1|on)$/i.test(value)) {
    return true
  }

  if (/^(?:n|no|false|0|off)$/i.test(value)) {
    return false
  }

  return default_
}

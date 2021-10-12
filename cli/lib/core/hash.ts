import crypto from 'crypto'

export function hash (data: unknown): string {
  const dataString = JSON.stringify(data)

  return crypto.createHash('SHA256').update(dataString).digest('hex')
}

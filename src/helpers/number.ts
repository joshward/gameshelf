export function pad (number: number, size: number): string {
  let val = `${number}`

  while (val.length < size) {
    val = `0${val}`
  }

  return val
}

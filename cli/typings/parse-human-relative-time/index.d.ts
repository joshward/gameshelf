declare module 'parse-human-relative-time/date-fns' {
  type parseHumanRelativeTime = (test: string, now?: Date) => Date

  export default function createParse (fns: dateFns): parseHumanRelativeTime
}

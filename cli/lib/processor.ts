export interface NameParts {
  name: string;
  subTitle?: string;
  editionTitle?: string;
}

const namePattern = /^\s*(?<main>.*?)\s*(?::\s*(?<sub>.*?))?\s*(?:\((?<note>.*)\)|\s(?<edition>\w+\s+Edition))?\s*$/i

export function chunkBggName (name: string): NameParts {
  const match = name.match(namePattern)
  if (!match) {
    return { name }
  }

  const groups = match.groups
  return {
    name: groups?.main ?? name,
    subTitle: groups?.sub,
    editionTitle: groups?.note ?? groups?.edition
  }
}

import React from 'react'
import { Box, Text, useInput } from 'ink'
import Link from 'ink-link'
import { FormInput } from '../../components/form/types'
import { BggGameWithVersions } from '../../lib/bgg-api'
import { wrap } from '../../lib/core/utils'

interface VersionData {
  versionName: string;
  versionId: number | undefined;
  publisher?: string;
  publishedYear?: string;
}

interface VersionDetailsProps {
  data: VersionData
}

const VersionDetails: React.VFC<VersionDetailsProps> = ({ data }) => {
  return (
    <Box width="100%" flexDirection="column">
      <Box width="100%" alignItems="center">
        {data.versionId !== undefined
          ? <Link url={`https://www.boardgamegeek.com/boardgameversion/${data.versionId}`}>
            { data.versionName }
          </Link>
          : <Text color="yellow" dimColor>
            { data.versionName }
          </Text>
        }
      </Box>

      <Box marginTop={1} flexDirection="row" justifyContent="space-around">

        <Box flexDirection="column" alignItems="center">
          <Text bold color="grey">
            Year Released
          </Text>
          <Text color="white">
            {data.publishedYear ?? '<unspecified>'}
          </Text>
        </Box>

        <Box flexDirection="column" alignItems="center">
          <Text bold color="grey">
            Publisher
          </Text>
          <Text color="white">
            {data.publisher ?? '<unspecified>'}
          </Text>
        </Box>

      </Box>
    </Box>
  )
}

interface VersionSelectorProps {
  versions: VersionData[];
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

const VersionSelector: React.VFC<VersionSelectorProps> = (props) => {
  const {
    versions,
    value,
    onChange,
  } = props

  const currentIndex = versions.findIndex(version => version.versionId === value)
  const current = versions[currentIndex]

  useInput((input, key) => {
    if (key.leftArrow) {
      onChange(versions[wrap(currentIndex - 1, versions.length)].versionId)
    }
    else if (key.rightArrow) {
      onChange(versions[wrap(currentIndex + 1, versions.length)].versionId)
    }
  })

  return (
    <Box borderStyle="round" width="100%" flexDirection="column">
      <VersionDetails data={current} />

      <Box width="100%" justifyContent="space-around" marginTop={2}>
        <Text color="gray">{currentIndex + 1} of {versions.length}</Text>
        <Text color="gray" dimColor>LEFT and RIGHT arrows to select.</Text>
      </Box>
    </Box>
  )
}

interface GameVersionInputProps {
  initialValue?: number;
  game: BggGameWithVersions;
}

export default function GameVersionInput (props: GameVersionInputProps): FormInput<number | undefined> {
  const versions = props.game.versions
  const noVersion: VersionData = {
    versionId: undefined,
    versionName: 'No Version',
    publisher: props.game.publisher,
    publishedYear: props.game.publishedYear,
  }

  const versionOptions: VersionData[] = [noVersion, ...versions]

  return {
    ...props,
    label: 'Game Versions',
    defaultValue: undefined,
    isValueSet: (value: number | undefined) => value !== undefined,
    valueRenderer: ({ value }) => {
      if (versions.length === 0) {
        return <Text color="gray">No Versions Available</Text>
      }

      const version = versionOptions.find(v => v.versionId === value)

      return (
        <Text color="lightgrey">{version?.versionName} <Text dimColor>({versions.length} available)</Text></Text>
      )
    },
    componentRenderer: (rendererProps) => (
      <VersionSelector
        versions={versionOptions}
        value={rendererProps.value}
        onChange={rendererProps.onChange}
      />
    )
  }
}

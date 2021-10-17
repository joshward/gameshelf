import React, { useMemo } from 'react'
import {
  Form,
  FormStructure,
  FormTextInput,
  FormOptionalTextInput,
  HumanDateInput,
  MultiSelectInput,
} from '../../components/form'
import { BggGameWithVersions } from '../../lib/bgg-api'
import GameExpansionsInput from './GameExpansionsInput'
import GameVersionInput from './GameVersionInput'
import { GameFormData } from '../../lib/types'

interface GameFormProps {
  data: GameFormData;
  game: BggGameWithVersions;
  onSubmit: (data: GameFormData) => void;
  onCancel: () => void;
}

const GameForm: React.VFC<GameFormProps> = (props) => {
  const {
    data,
    game,
    onSubmit,
    onCancel,
  } = props

  const form = useMemo<FormStructure<GameFormData>>(() => ({
    name: FormTextInput({ label: 'Name', required: true, initialValue: data.name }),
    subTitle: FormTextInput({ label: 'Sub Title', initialValue: data.subTitle }),
    editionTitle: FormTextInput({ label: 'Edition Title', initialValue: data.editionTitle }),
    versionId: GameVersionInput({ initialValue: data.versionId, game }),
    addedDate: HumanDateInput({
      label: 'Added Date',
      onlyAllowPastDates: true,
      dateOnly: true,
      initialValue: data.addedDate
    }),
    tags: MultiSelectInput({
      label: 'Tags',
      options: [
        { label: 'Favorite', value: 'fav' },
        { label: 'Wife\'s Favorite', value: 'w-fav' },
      ],
      initialValue: data.tags
    }),
    expansionsIds: GameExpansionsInput({ initialValue: data.expansionsIds, game }),
    sale: FormOptionalTextInput({
      label: 'Sale',
      initialValue: data.sale,
      emptyText: '-NO-',
      description: '$Price - condition - notes',
    }),
  }), [
    game,
    data.name,
    data.subTitle,
    data.editionTitle,
    data.versionId,
    data.addedDate,
    data.tags,
    data.expansionsIds,
    data.sale,
  ])

  return (
    <Form
      form={form}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  )
}

export default GameForm

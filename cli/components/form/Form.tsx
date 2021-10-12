import { Box, useFocusManager, useInput } from 'ink'
import React, { useEffect, useState } from 'react'
import { getTypedObjectEntries } from '../../lib/core/utils'
import { FormFieldRenderer } from './FormFieldRenderer'
import { SubmitButton } from './SubmitButton'
import { FormObject, FormStructure } from './types'

export interface FormProps<T extends FormObject> {
  readonly form: FormStructure<T>;
  readonly onSubmit: (value: T) => void;
  readonly onCancel: () => void;
}

function canSubmit <T extends FormObject>(value: T, form: FormStructure<T>): boolean {
  return getTypedObjectEntries(form).every(([key, input]) =>
    !input.required || input.isValueSet(value[key])
  )
}

function buildInitialFormObject <T extends FormObject>(form: FormStructure<T>): T {
  return getTypedObjectEntries(form)
    .reduce((prev, [key, input]) => ({ ...prev, [key]: input.initialValue ?? input.defaultValue }), {} as T)
}

export const Form = <T extends FormObject>(props: FormProps<T>): JSX.Element => {
  const {
    form,
    onSubmit,
    onCancel,
  } = props

  const focusManager = useFocusManager()
  const [value, setValue] = useState(() => buildInitialFormObject(form))
  const [editingField, setEditingField] = useState<keyof T>()

  useEffect(() => {
    focusManager.enableFocus()
  }, [focusManager])

  useInput((input, key) => {
    if (key.upArrow) {
      focusManager.focusPrevious()
    } else if (key.downArrow) {
      focusManager.focusNext()
    } else if (key.escape) {
      onCancel()
    }
  }, {
    isActive: !editingField
  })

  const canSubmitForm = canSubmit(value, form)

  const handleChange = <K extends keyof T>(key: K, next: T[K]): void => {
    setValue(prev => ({ ...prev, [key]: next}))
  }

  return (
    <Box width="100%" height="100%" flexDirection="column">
      {getTypedObjectEntries(form).map(([key, input]) => (
        <FormFieldRenderer
          key={`${key}`}
          prop={key}
          value={value[key]}
          input={input}
          onChange={(next) => handleChange(key, next)}
          onSetEditingField={setEditingField}
          editingField={editingField}
        />
      ))
      }
      {!editingField && (
        <Box flexDirection="row-reverse">
          <SubmitButton canSubmit={canSubmitForm} onSubmit={() => onSubmit(value)} />
        </Box>
      )}
    </Box>
  )
}

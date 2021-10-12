import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import * as dateFns from 'date-fns'
import createParse from 'parse-human-relative-time/date-fns'
import { ForegroundColor } from 'chalk'
import { ComponentRendererProps, FormInput, FormInputCommon } from '../types'

const parseHumanRelativeTime = createParse(dateFns)

interface HumanDateInput {
  dateOnly?: boolean;
  onlyAllowPastDates?: boolean;
}

interface HumanDateInputRenderProps {
  rendererProps: ComponentRendererProps<Date | undefined>;
  inputProps: FormInputCommon<Date | undefined> & HumanDateInput;
}

const getDateFormat = (dateOnly?: boolean) => dateOnly ? 'MM/dd/yyyy' : 'MM/dd/yyyy HH:mm'

const isValidDate = (date: Date | undefined): date is Date => date != null && !isNaN(date.getTime())

const safeCall = (call: () => Date): Date | undefined => {
  try {
    return call()
  } catch {
    return undefined
  }
}

const HumanDateInputRender: React.VFC<HumanDateInputRenderProps> = ({ rendererProps, inputProps }) => {
  const [textValue, setTextValue] = useState(() =>
    rendererProps.value
      ? dateFns.format(rendererProps.value, getDateFormat(inputProps.dateOnly))
      : ''
  )

  dateFns.startOfDay(new Date())

  const handleChange = (value: string) => {
    setTextValue(value)
    rendererProps.onClearError()

    if (!value) {
      rendererProps.onChange(undefined)
      return
    }

    let parsed: Date | undefined = safeCall(() => dateFns.parse(value, getDateFormat(inputProps.dateOnly), new Date()))

    if (!isValidDate(parsed)) {
      parsed = safeCall(() => parseHumanRelativeTime(value))

      if (!isValidDate(parsed)) {
        rendererProps.onChange(undefined)
        rendererProps.onError('Unable to parse value')
        return
      }
    }

    if (inputProps.dateOnly) {
      parsed = dateFns.startOfDay(parsed)
    }

    if (inputProps.onlyAllowPastDates && dateFns.isFuture(parsed)) {
      rendererProps.onError('Date cannot be in the future')
    }

    rendererProps.onChange(parsed)
  }

  const dateDisplay = rendererProps.value
    ? dateFns.format(rendererProps.value, getDateFormat(inputProps.dateOnly))
    : '(No Value)'

  const dateDisplayColor: typeof ForegroundColor = rendererProps.value
    ? dateFns.isToday(rendererProps.value) ? 'yellow' : 'green'
    : 'grey'

  return (
    <Box width="100%" flexDirection="column">
      <Text color={dateDisplayColor}>
        {dateDisplay}
      </Text>
      <Box borderStyle={'round'} width="100%">
        <TextInput
          value={textValue}
          onChange={handleChange}
        />
      </Box>
    </Box>
  )
}

export function HumanDateInput(props: FormInputCommon<Date | undefined> & HumanDateInput): FormInput<Date | undefined> {
  return {
    ...props,
    defaultValue: undefined,
    isValueSet: (value: Date | undefined) => value != null,
    valueRenderer: ({ value }): JSX.Element => (
      <>
        {value && dateFns.format(value, getDateFormat(props.dateOnly))}
      </>
    ),
    componentRenderer: (rendererProps) => <HumanDateInputRender rendererProps={rendererProps} inputProps={props} />
  }
}

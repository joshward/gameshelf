import React, { useMemo, useState } from 'react'
import { useInput, Box, Text } from 'ink'
import FocusedBox from '../../components/FocusedBox'
import { wrap } from '../../lib/core/utils'

const Button: React.FC<{ isSelected: boolean }> = (props) => {
  return (
    <Box
      paddingX={2}
      borderStyle="single"
      borderColor={props.isSelected ? 'green' : 'gray'}
    >
      <Text color={props.isSelected ? 'green' : 'gray'}>
        { props.children }
      </Text>
    </Box>
  )
}

interface AlterActionSelectorProps {
  isInCollection: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onRemove: () => void;
  onCancel: () => void;
}

const AlterActionSelector: React.VFC<AlterActionSelectorProps> = (props) => {
  const {
    isInCollection,
    onAdd,
    onEdit,
    onRemove,
    onCancel,
  } = props

  const [actionValidation, setActionValidation] = useState<{ action: () => void, text: string }>()
  const [selectionIndex, setSelectionIndex] = useState(0)

  const actions = useMemo(() => {
    return isInCollection ? ['edit', 'remove'] : ['add']
  }, [isInCollection])

  const selectedAction = actions[selectionIndex]

  useInput((input, key) => {
    if (key.leftArrow) {
      setSelectionIndex(prev => wrap(prev - 1, actions.length))
    }
    else if (key.rightArrow) {
      setSelectionIndex(prev => wrap(prev + 1, actions.length))
    }
    else if (key.escape) {
      if (actionValidation) {
        setActionValidation(undefined)
      } else {
        onCancel()
      }
    }
    else if (key.return) {
      if (actionValidation) {
        actionValidation.action()
        return
      }

      switch (selectedAction) {
      case 'add':
        onAdd()
        break
      case 'edit':
        onEdit()
        break
      case 'remove':
        setActionValidation({ action: onRemove, text: 'Remove Game?' })
        break
      default:
        throw new Error(`Unknown Action "${selectedAction}"`)
      }
    }
  })

  if (actionValidation) {
    return (
      <FocusedBox width="100%">
        <Text color="yellow">{ actionValidation.text }</Text>
        <Text color="gray">Enter to confirm. ESC to cancel.</Text>
      </FocusedBox>
    )
  }

  return (
    <FocusedBox
      width="100%"
      flexDirection="row"
      justifyContent="space-around"
    >

      {actions.includes('add') &&
        <Button isSelected={selectedAction === 'add'}>
          Add
        </Button>
      }

      {actions.includes('edit') &&
        <Button isSelected={selectedAction === 'edit'}>
          Edit
        </Button>
      }

      {actions.includes('remove') &&
        <Button isSelected={selectedAction === 'remove'}>
          Remove
        </Button>
      }
    </FocusedBox>
  )
}

export default AlterActionSelector

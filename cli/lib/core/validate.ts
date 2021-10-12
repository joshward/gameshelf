import { validateOrReject, ValidationError } from 'class-validator'
import { stringifyError } from './error'
import { isArrayOf } from './utils'

export interface ValidationIssue {
  target: string;
  issue: string;
}

interface ValidationTransformation {
  key: string;
  message: (original: string) => string;
  stop?: boolean;
}

const parseContains = (message: string): string => {
  const regex = /must contain a (.*) string$/
  const matches = message.match(regex)
  return matches?.[1] ?? ''
}

const transformations: ReadonlyArray<ValidationTransformation> = [
  { key: 'whitelistValidation', message: () => 'is unexpected', stop: true },
  { key: 'isNotEmpty', message: () => 'requires a value', stop: true },
  { key: 'isString', message: () => 'must be a string' },
  { key: 'isBoolean', message: () => 'must be a bool' },
  { key: 'isInt', message: () => 'must be an int' },
  { key: 'IsPositive', message: () => 'must be a positive number' },
  { key: 'contains', message: original => `must contain '${parseContains(original)}'` },
]

const buildIssuesFromConstraints = (key: string, constraints?: { [type: string]: string; }): ValidationIssue[] => {
  if (!constraints) {
    return []
  }
  const issues: ValidationIssue[] = []

  const constraintKeys = Object.keys(constraints)
  for (const transform of transformations) {
    const found = constraintKeys.indexOf(transform.key)
    if (found < 0) {
      continue
    }

    issues.push({
      target: key,
      issue: transform.message(constraints[transform.key])
    })

    constraintKeys.splice(found, 1)

    if (transform.stop) {
      return issues
    }
  }

  constraintKeys.forEach(constraintKey =>
    issues.push({
      issue: constraints[constraintKey],
      target: key,
    }))

  return issues
}

const transformValidationErrorsToIssues = (errors?: ValidationError[], parent?: string): ValidationIssue[] => {
  if (!errors) {
    return []
  }

  return errors.flatMap(error => {
    const key = parent ? `${parent}.${error.property}` : error.property

    const issues = buildIssuesFromConstraints(key, error.constraints)
    issues.push(...transformValidationErrorsToIssues(error.children, key))
    return issues
  })
}

export class ObjectValidationError extends Error {
  constructor(
    message: string,
    private validationErrors: ValidationError[],
  ) {
    super(message)
  }

  public get validationIssues(): ValidationIssue[] {
    return transformValidationErrorsToIssues(this.validationErrors)
  }
}

export const validateObject = async (object: unknown): Promise<void> => {
  try {
    await validateOrReject(object as Record<string, unknown>, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false,
      }
    })
  } catch (error) {
    const message = 'Object validation failed'
    if (isArrayOf(error, ValidationError)) {
      throw new ObjectValidationError(message, error)
    }

    throw new Error(`${message}: ${stringifyError(error)}`)
  }
}

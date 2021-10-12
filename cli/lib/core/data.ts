import { readFile, writeFile } from './file'
import { stringifyError } from './error'
import { getParseTypeFromFileName, parse } from './parse'
import { transformToClass } from './transform'
import { validateObject, ObjectValidationError, ValidationIssue } from './validate'
import { getSerializerFromFileName, serialize } from './serialize'

interface LoadDataOptionsBase<T> {
  default?: () => T,
}

interface NoTransformDataOptions<T> extends LoadDataOptionsBase<T> {
  transform?: never;
  validate?: false;
}

interface TransformDataOptions<T> extends LoadDataOptionsBase<T> {
  transform: new () => T;
  validate?: boolean;
}

type LoadDataOptions<T> =
  | NoTransformDataOptions<T>
  | TransformDataOptions<T>
  ;

const loadFile = async (fileName: string, hasDefault: boolean): Promise<string | undefined> => {
  try {
    return await readFile(fileName)
  } catch (error) {
    if (hasDefault) {
      return undefined
    }

    throw new Error(`Failed to load data from ${fileName}: ${stringifyError(error)}`)
  }
}

const saveFile = async (fileName: string, data: string): Promise<void> => {
  try {
    await writeFile(fileName, data)
  } catch (error) {
    throw new Error(`Failed to save data to ${fileName}: ${stringifyError(error)}`)
  }
}

const parseData = (rawFile: string | undefined, fileName: string, makeDefault?: () => unknown): unknown => {
  if (rawFile === undefined) {
    if (!makeDefault) {
      // if this gets thrown it's likely a bug
      throw new Error(`No data loaded from ${fileName}`)
    }

    return makeDefault()
  }

  try {
    const parseType = getParseTypeFromFileName(fileName)
    return parse(rawFile, parseType)
  } catch (error) {
    throw new Error(`Failed to parse ${fileName}: ${stringifyError(error)}`)
  }
}

const transform = <T>(parseData: unknown, type: new () => T, fileName: string): T => {
  try {
    return transformToClass(type, parseData)
  } catch (error) {
    throw new Error(`Failed to transform data from ${fileName}: ${stringifyError(error)}`)
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: ValidationIssue[],
  ) {
    super(message)
  }
}

const validate = async <T>(object: T, fileName: string): Promise<void> => {
  try {
    await validateObject(object)
  } catch (error) {
    if (error instanceof ObjectValidationError) {
      throw new ValidationError(`Failed to validate data from ${fileName}`, error.validationIssues)
    }

    throw new Error(`Failed to validate data from ${fileName}: ${stringifyError(error)}`)
  }
}

const serializeData = (data: unknown, fileName: string): string => {
  try {
    const serializeType = getSerializerFromFileName(fileName)
    return serialize(data, serializeType)
  } catch (error) {
    throw new Error(`Failed to serialize data for ${fileName}: ${stringifyError(error)}`)
  }
}

export const loadData = async <T>(fileName: string, options?: LoadDataOptions<T>): Promise<T> => {
  const rawFile = await loadFile(fileName, options?.default !== undefined)
  const parsedData = parseData(rawFile, fileName, options?.default)

  if (!options?.transform) {
    return parsedData as T
  }

  const transformedData = transform(parsedData, options.transform, fileName)

  if (options.validate) {
    await validate(transformedData, fileName)
  }

  return transformedData
}

export const saveData = async<T>(fileName: string, data: T): Promise<void> => {
  const serializedData = serializeData(data, fileName)
  await saveFile(fileName, serializedData)
}

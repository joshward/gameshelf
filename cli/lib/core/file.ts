import { default as path } from 'path'
import { default as fs } from 'fs-extra'
import { stringifyError } from './error'

const DEFAULT_ENCODING = 'utf8'

export const readFile = async (fileName: string): Promise<string> => {
  try {
    return await fs.readFile(fileName, DEFAULT_ENCODING)
  } catch (error) {
    throw new Error(`Failed to load file ${fileName} -> ${stringifyError(error)}`)
  }
}

export const writeFile = async (fileName: string, data: string): Promise<void> => {
  try {
    await makeDirectories(fileName)
    await fs.writeFile(fileName, data, { encoding: DEFAULT_ENCODING })
  } catch (error) {
    throw new Error(`Failed to write file ${fileName} -> ${stringifyError(error)}`)
  }
}

export const makeDirectories = async (fileName: string): Promise<void> => {
  try {
    const directories = path.dirname(fileName)

    await fs.ensureDir(directories)
  } catch (error) {
    throw new Error(`Failed to make directories for ${fileName} -> ${stringifyError(error)}`)
  }
}

export const walkBackPath = async (startAt: string, lookingFor: string): Promise<string> => {
  startAt = path.resolve(startAt)

  if (!(await fs.pathExists(startAt)) || !(await fs.stat(startAt)).isDirectory())
  {
    throw new Error(`Cannot walk back path from ${startAt}. No such directory.`)
  }

  const dirs = path.resolve(startAt).split(path.sep)

  for (let i = 0; i < dirs.length; i++) {
    const basedir = i < dirs.length - 1
      ? dirs.slice(0, dirs.length - i).join(path.sep)
      : path.sep

    if (await fs.pathExists(path.join(basedir, lookingFor))) {
      return path.join(basedir, lookingFor)
    }
  }

  throw new Error(`Failed to find ${lookingFor} in directory or ancestor of ${startAt}`)
}

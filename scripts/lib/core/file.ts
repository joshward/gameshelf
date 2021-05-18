import { promisify }  from 'util';
import { default as path } from 'path';
import { default as fs } from 'fs';
import { stringifyError } from './error';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

const DEFAULT_ENCODING = 'utf8';

export const readFile = async (fileName: string): Promise<string> => {
  try {
    return await readFileAsync(fileName, DEFAULT_ENCODING);
  } catch (error) {
    throw new Error(`Failed to load file ${fileName} -> ${stringifyError(error)}`);
  }
}

export const writeFile = async (fileName: string, data: string): Promise<void> => {
  try {
    await makeDirectories(fileName);
    await writeFileAsync(fileName, data, { encoding: DEFAULT_ENCODING });
  } catch (error) {
    throw new Error(`Failed to write file ${fileName} -> ${stringifyError(error)}`);
  }
}

export const makeDirectories = async (fileName: string): Promise<void> => {
  try {
    const directories = path.dirname(fileName);
    if (fs.existsSync(directories)) {
      return;
    }

    mkdirAsync(directories, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to make directories for ${fileName} -> ${stringifyError(error)}`);
  }
}

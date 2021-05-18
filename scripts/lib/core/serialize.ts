import { default as path } from 'path';
import { stringifyError } from './error';

export type SerializeType = 'JSON';

export const getSerializerFromFileName = (fileName: string): SerializeType => {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === '.json') {
    return 'JSON';
  }

  throw new Error(`No serialize type known for file extension "${extension}" (${fileName})`);
}

export const serialize = (data: unknown, type: SerializeType): string => {
  try {
    if (type === 'JSON') {
      return JSON.stringify(data, undefined, 2);
    }
  } catch (error) {
    throw new Error(`Failed to serialize data to ${type}: ${stringifyError(error)}`);
  }

  throw new Error(`Umm 😰... No serializer implemented for ${type}`);
}

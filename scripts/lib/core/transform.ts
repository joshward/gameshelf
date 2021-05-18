import { plainToClass } from 'class-transformer';

export const transformToClass = <T>(type: new () => T, raw: unknown): T => {
  return plainToClass(type, raw);
}

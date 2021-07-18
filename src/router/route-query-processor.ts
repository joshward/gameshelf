import VueRouter, { Route } from 'vue-router'
import { Dictionary } from 'vue-router/types/router'
import { ClassConstructor, plainToClass } from 'class-transformer'
import { isTruthy } from '@/helpers'

const queryNameSymbol = Symbol('query:name')
const queryDefaultSymbol = Symbol('query:default')

export const query = (name: string, def?: unknown): PropertyDecorator => {
  return (target: object): void => {
    Reflect.defineMetadata(queryNameSymbol, name, target)
    Reflect.defineMetadata(queryDefaultSymbol, def, target)
  }
}

const getQueryMetadata = (target: object, prop: string) => {
  return {
    name: Reflect.getMetadata(queryNameSymbol, target, prop) ?? prop,
    def: Reflect.getMetadata(queryDefaultSymbol, target, prop)
  }
}

const toDictionary = (parameters: object): Dictionary<string> => {
  const dict: Dictionary<string> = {}

  for (const [key, value] of Object.entries(parameters)) {
    if (isTruthy(value)) {
      const { name, def } = getQueryMetadata(parameters, key)

      dict[name] = String(value ?? def)
    }
  }

  return dict
}

export const isQuerySame = (parameters: object, query: Route['query']): boolean => {
  const newQuery = toDictionary(parameters)

  const newQueryEntries = Object.entries(newQuery).filter(entry => isTruthy(entry[1]))
  const queryEntries = Object.entries(query).filter(entry => isTruthy(entry[1]))

  if (newQueryEntries.length !== queryEntries.length) {
    return false
  }

  return newQueryEntries.every(([key, value]) => query[key] === value)
}

export const parseQueryParameters = <T> (type: ClassConstructor<T>, query: Route['query']): T => {
  return plainToClass(type, query, { enableImplicitConversion: true })
}

export const setQueryParameters = async (
  parameters: object,
  query: Route['query'],
  router: VueRouter
): Promise<void> => {
  const isAlreadySet = Object.values(query).some(value => isTruthy(value))

  const newQuery = toDictionary(parameters)

  if (isAlreadySet) {
    await router.replace({ query: newQuery })
  } else {
    await router.push({ query: newQuery })
  }
}

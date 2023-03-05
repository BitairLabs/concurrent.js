import { ErrorMessage, SYMBOL, ValueType } from './constants.js'
import { ThreadedFunction } from './threaded_function.js'
import { ThreadedObject } from './threaded_object.js'

import type { ExecutionSettings } from '../index.d.js'
import type { ThreadPool } from './thread_pool.js'
import { ConcurrencyError } from './error.js'

export class ModuleLoader {
  constructor(private pool: ThreadPool) {}

  async load(moduleSrc: string, execSettings: ExecutionSettings) {
    const exports = await import(moduleSrc)
    const pool = this.pool

    return new Proxy(exports, {
      get(target, key) {
        if (Reflect.has(target, key)) {
          const _export = Reflect.get(target, key)

          return new Proxy(_export, {
            construct(_target, args, newTarget) {
              return createConstructorProxy(pool, moduleSrc, newTarget.name, args, execSettings)
            },
            apply(target, _thisArg, args) {
              return createFunctionProxy(pool, moduleSrc, target.name, args, execSettings)
            }
          })
        } else {
          return Reflect.get(target, key)
        }
      }
    })
  }
}

async function createFunctionProxy(
  pool: ThreadPool,
  moduleSrc: string,
  exportName: string,
  args: unknown[],
  execSettings: ExecutionSettings
) {
  const fn = await ThreadedFunction.create(pool, moduleSrc, exportName, execSettings)
  return fn.invoke(args)
}

async function createConstructorProxy(
  pool: ThreadPool,
  moduleSrc: string,
  exportName: string,
  args: unknown[],
  execSettings: ExecutionSettings
) {
  const obj = await ThreadedObject.create(pool, moduleSrc, exportName, args, execSettings)

  return new Proxy(obj.propertyMap, {
    get(target, key) {
      if (key === SYMBOL.DISPOSE) return obj.dispose.bind(obj) as never
      if (!Reflect.has(target, key)) return undefined

      const prop = Reflect.get(target, key)
      if (prop instanceof Promise) return prop

      if (obj.propertyMap[key as string] === ValueType.Function) {
        return (...params: unknown[]) => obj.invoke(key as string, params)
      } else {
        return obj.getProperty(key as string)
      }
    },

    set(target, key, value) {
      if (!Reflect.has(target, key)) return false
      if (obj.propertyMap[key as string] === ValueType.Function)
        throw new ConcurrencyError(ErrorMessage.MethodAssignment)

      const setter = new Promise((resolve, reject) => {
        obj
          .setProperty(key as string, value)
          .then(() => {
            Reflect.set(target, key, ValueType.Any)
            resolve(value)
          })
          .catch(error => reject(error))
      })

      Reflect.set(target, key, setter)

      return true
    }
  })
}

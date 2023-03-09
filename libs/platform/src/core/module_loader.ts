import { ErrorMessage, SYMBOL } from './constants.js'
import { ConcurrencyError } from './error.js'
import { ThreadedFunction } from './threaded_function.js'
import { ThreadedObject } from './threaded_object.js'
import { isFunction } from './utils.js'

import type { ExecutionSettings } from '../index.d.js'
import type { ThreadPool } from './thread_pool.js'

export class ModuleLoader {
  constructor(private pool: ThreadPool) {}

  async load(moduleSrc: string, execSettings: ExecutionSettings) {
    const pool = this.pool
    const module = await import(moduleSrc)

    const cache = {}
    return new Proxy(module, {
      get(module, exportName) {
        const _export = Reflect.get(module, exportName)

        if (!Reflect.has(module, exportName)) return
        else if (!isFunction(_export)) throw new ConcurrencyError(ErrorMessage.NonFunctionLoad)
        else {
          if (!Reflect.has(cache, exportName))
            Reflect.set(cache, exportName, createFunctionProxy(pool, moduleSrc, _export, execSettings))

          return Reflect.get(cache, exportName)
        }
      }
    })
  }
}

function createFunctionProxy(
  pool: ThreadPool,
  moduleSrc: string,
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: Function,
  execSettings: ExecutionSettings
) {
  const threadedFunction = new ThreadedFunction(pool, moduleSrc, target.name, execSettings)

  return new Proxy(target, {
    get(target, key) {
      const prop = Reflect.get(target, key)

      if (!Reflect.has(target, key)) return
      else if (prop instanceof AsyncSetter) return prop.wait()
      else if (!isFunction(prop)) return threadedFunction.getStaticProperty(key as string)
      else return (...params: unknown[]) => threadedFunction.invokeStaticMethod(key as string, params)
    },

    set(target, key, value) {
      const prop = Reflect.get(target, key)

      if (!Reflect.has(target, key)) return false
      else if (isFunction(prop)) throw new ConcurrencyError(ErrorMessage.MethodAssignment)
      else {
        const setter = new AsyncSetter(() =>
          threadedFunction.setStaticProperty(key as string, value).then(() => {
            Reflect.set(target, key, undefined)
          })
        )

        Reflect.set(target, key, setter)
        return true
      }
    },

    construct(target, args) {
      return createObjectProxy(pool, moduleSrc, target.name, args, execSettings)
    },

    apply(_target, _thisArg, args) {
      return threadedFunction.invoke(args)
    }
  })
}

async function createObjectProxy(
  pool: ThreadPool,
  moduleSrc: string,
  exportName: string,
  args: unknown[],
  execSettings: ExecutionSettings
) {
  const threadedObject = await ThreadedObject.create(pool, moduleSrc, exportName, args, execSettings)

  return new Proxy(threadedObject.target, {
    get(target, key) {
      const prop = Reflect.get(target, key)

      if (key === SYMBOL.DISPOSE) return threadedObject.dispose.bind(threadedObject) as never
      else if (!Reflect.has(target, key)) return
      else if (prop instanceof AsyncSetter) return prop.wait()
      else if (isFunction(prop)) return (...params: unknown[]) => threadedObject.invoke(key as string, params)
      else return threadedObject.getProperty(key as string)
    },

    set(target, key, value) {
      const prop = Reflect.get(target, key)

      if (!Reflect.has(target, key)) return false
      else if (isFunction(prop)) throw new ConcurrencyError(ErrorMessage.MethodAssignment)
      else {
        const setter = new AsyncSetter(() =>
          threadedObject.setProperty(key as string, value).then(() => {
            Reflect.set(target, key, undefined)
          })
        )
        Reflect.set(target, key, setter)

        return true
      }
    }
  })
}

class AsyncSetter {
  constructor(private setter: () => Promise<void>) {}

  wait() {
    return this.setter()
  }
}

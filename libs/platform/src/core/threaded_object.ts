import { SYMBOL, ValueType } from './constants.js'
import { Task } from './task.js'
import { isFunction, isSymbol } from './utils.js'

import type { ExecutionSettings } from '../index.d.js'
import type { Thread } from './thread.js'
import type { ThreadPool } from './thread_pool.js'
import type { Dict, InstantiateObjectResult } from './types.js'

export class ThreadedObject {
  private thread?: Thread
  private id?: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any = {}

  constructor(private pool: ThreadPool) {}

  async init(moduleSrc: string, exportName: string, ctorArgs: unknown[], execSettings: ExecutionSettings) {
    this.thread = await this.pool.getThread(execSettings.parallel)
    const task = Task.instantiateObject(moduleSrc, exportName, ctorArgs)
    const [id, propertyTypeMap] = (await this.thread.run(task)) as InstantiateObjectResult
    this.id = id

    this.pool.registerObject(this, this.id, this.thread as never)

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    return new Proxy(createShadowObject(propertyTypeMap), {
      get(target, key) {
        if (key === SYMBOL.DISPOSE) return _this.dispose.bind(_this) as never
        if (isSymbol(key)) return undefined

        const prop = Reflect.get(target, key)
        if (!isFunction(prop)) {
          if (prop instanceof Promise) return prop
          return _this.getProperty.call(_this, key as string)
        } else {
          return (...params: unknown[]) => _this.invoke.call(_this, key as string, params)
        }
      },

      set(target, key, value) {
        if (isSymbol(key)) return false

        const setter = new Promise((resolve, reject) => {
          _this.setProperty
            .call(_this, key as string, value)
            .then(() => {
              Reflect.set(target, key, undefined)
              resolve(value)
            })
            .catch(error => reject(error))
        })
        Reflect.set(target, key, setter)

        return true
      }
    })
  }

  private async getProperty(methodName: string) {
    const thread = this.thread as Thread
    const task = Task.getInstanceProperty(this.id as number, methodName)
    return await thread.run(task)
  }

  private async setProperty(methodName: string, value: unknown) {
    const thread = this.thread as Thread
    const task = Task.setInstanceProperty(this.id as number, methodName, value)
    return await thread.run(task)
  }

  private async invoke(methodName: string, args: unknown[]) {
    const thread = this.thread as Thread
    const task = Task.invokeInstanceMethod(this.id as number, methodName, args)
    return await thread.run(task)
  }

  async dispose() {
    this.pool.unregisterObject(this)
    this.pool.disposeObject(this.id as never, this.thread as never)
  }
}

function createShadowObject(propertyTypeMap: Dict<number>) {
  const obj = {}
  for (const key in propertyTypeMap) {
    if (Object.prototype.hasOwnProperty.call(propertyTypeMap, key)) {
      const propType = propertyTypeMap[key]
      const descriptor: PropertyDescriptor = {}
      if (propType === ValueType.Function) descriptor.value = () => undefined
      else descriptor.writable = true
      descriptor.configurable = true
      Object.defineProperty(obj, key, descriptor)
    }
  }
  return obj
}

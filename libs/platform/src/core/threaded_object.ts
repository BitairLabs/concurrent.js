import { AsyncSetter } from './async_setter.js'
import { ErrorMessage, SYMBOL } from './constants.js'
import { ConcurrencyError } from './error.js'
import { Task } from './task.js'
import { isFunction, isSymbol } from './utils.js'

import type { ExecutionSettings, IAsyncSetter } from '../index.d.js'
import type { Thread } from './thread.js'
import type { ThreadPool } from './thread_pool.js'
import type { Constructor } from './types.js'

export class ThreadedObject {
  private thread?: Thread
  private id?: number
  private instantiated = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any = {}

  constructor(
    private pool: ThreadPool,
    private moduleSrc: string,
    private exportName: string,
    ctor: Constructor,
    private ctorArgs: unknown[],
    private execSettings: ExecutionSettings
  ) {
    const obj = Reflect.construct(ctor, ctorArgs)
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    this.proxy = createProxy(obj, {
      get(key) {
        if (key === SYMBOL.DISPOSE) return _this.dispose.bind(_this) as never
        return _this.getProperty.call(_this, key as string)
      },
      set(key, value: unknown) {
        return _this.setProperty.call(_this, key as string, value)
      },
      apply(key, args) {
        return _this.invoke.call(_this, key as string, args)
      }
    })
  }

  private async getProperty(methodName: string) {
    if (!this.instantiated) await this.instantiate()
    const thread = this.thread as Thread
    const task = Task.getInstanceProperty(this.id as number, methodName)
    return await thread.run(task)
  }

  private async setProperty(methodName: string, value: unknown) {
    if (!this.instantiated) await this.instantiate()
    const thread = this.thread as Thread
    const task = Task.setInstanceProperty(this.id as number, methodName, value)
    return await thread.run(task)
  }

  private async invoke(methodName: string, args: unknown[]) {
    if (!this.instantiated) await this.instantiate()
    const thread = this.thread as Thread
    const task = Task.invokeInstanceMethod(this.id as number, methodName, args)
    return await thread.run(task)
  }

  async dispose() {
    this.pool.unregisterObject(this)
    this.pool.disposeObject(this.id as never, this.thread as never)
  }

  private async instantiate() {
    const thread = (this.thread = await this.pool.getThread(this.execSettings.parallel))
    const task = Task.instantiateObject(this.moduleSrc, this.exportName, this.ctorArgs)
    this.id = (await thread.run(task)) as number
    this.pool.registerObject(this, this.id, this.thread as never)
    this.instantiated = true
  }
}

function createProxy(obj: object, handler: ProxyHandler) {
  return new Proxy(obj, {
    get(target, key) {
      if (isSymbol(key) && key !== SYMBOL.DISPOSE) return undefined
      const prop = Reflect.get(target, key)
      return !isFunction(prop) ? handler.get(key) : (...params: unknown[]) => handler.apply(key, params)
    },
    set(_target, key, setter: IAsyncSetter) {
      if (isSymbol(key) && key !== SYMBOL.DISPOSE) return false
      if (!(setter instanceof AsyncSetter)) throw new ConcurrencyError(ErrorMessage.AsyncSetterRequired)
      handler
        .set(key, setter.value)
        .then(() => {
          if (setter.done) setter.done()
        })
        .catch(error => {
          if (setter.done) setter.done(error)
        })
      return true
    }
  })
}

export declare type ProxyHandler = {
  get(key: string | symbol): Promise<unknown>
  set(key: string | symbol, value: unknown): Promise<unknown>
  apply(key: string | symbol, args: unknown[]): Promise<unknown>
}

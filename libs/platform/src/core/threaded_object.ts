import { Task } from './task.js'

import type { ExecutionSettings } from '../index.d.js'
import type { Constructor } from './types.js'
import type { Thread } from './thread.js'
import type { ThreadPool } from './thread_pool.js'
import { ConcurrencyError } from './error.js'
import { ErrorMessage } from './constants.js'

const FUNCTION = 'function'
const CONSTRUCTOR = 'constructor'
const DISPOSE = 'dispose'

export class ThreadedObject<T extends Constructor> {
  private thread?: Thread
  private id?: number
  private instantiated = false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy: any = {}

  constructor(
    private pool: ThreadPool,
    private moduleSrc: string,
    private exportName: string,
    ctor: T,
    private ctorArgs: unknown[],
    private execSettings: ExecutionSettings
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    const prototype = ctor.prototype
    for (const property of Object.getOwnPropertyNames(prototype)) {
      if (property === DISPOSE) throw new ConcurrencyError(ErrorMessage.DisposeOverridden)

      if (typeof prototype[property] === FUNCTION && property !== CONSTRUCTOR) {
        const methodName = property as string
        this.proxy[methodName] = async function invoke(...params: unknown[]) {
          return _this.invoke.call(_this, methodName, params)
        }
      }
    }

    this.proxy[DISPOSE] = async () => await this.dispose()
  }

  private async invoke(methodName: string, args: unknown[]) {
    if (!this.instantiated) {
      await this.instantiate()
      this.instantiated = true
    }
    const thread = this.thread as Thread
    const task = Task.invokeMethod(this.id as number, methodName, args)
    return await thread.run(task)
  }

  private async instantiate(): Promise<number> {
    const thread = (this.thread = await this.pool.getThread(this.execSettings.parallel))
    const ctorName = this.exportName
    const task = Task.instantiateObject(this.moduleSrc, ctorName, this.ctorArgs)
    this.id = (await thread.run(task)) as number
    this.pool.registerObject(this, this.id, this.thread as never)
    return this.id
  }

  async dispose() {
    this.pool.unregisterObject(this)
    this.pool.disposeObject(this.id as never, this.thread as never)
  }
}

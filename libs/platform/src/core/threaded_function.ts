import { Task } from './task.js'

import type { ExecutionSettings } from '../index.d.js'
import type { Thread } from './thread.js'
import type { ThreadPool } from './thread_pool.js'
import type { FunctionProxy } from './types.js'

export class ThreadedFunction {
  private _thread?: Thread
  proxy: FunctionProxy

  constructor(
    private pool: ThreadPool,
    private moduleSrc: string,
    private exportName: string,
    private execSettings: ExecutionSettings
  ) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    this.proxy = {
      async invoke(args: unknown[]) {
        return _this.invoke.call(_this, args)
      }
    }
  }

  private async thread(): Promise<Thread> {
    if (!this._thread) {
      const thread = await this.pool.getThread(this.execSettings.parallel)
      this._thread = thread
    }

    return this._thread
  }

  private async invoke(args: unknown[]) {
    const thread = await this.thread()
    const task = Task.invokeFunction(this.moduleSrc, this.exportName, args)
    return await thread.run(task)
  }
}

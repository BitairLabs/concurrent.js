import { Task } from './task.js'

import type { ExecutionSettings } from '../index.d.js'
import type { Thread } from './thread.js'
import type { ThreadPool } from './thread_pool.js'
import type { FunctionProxy } from './types.js'

export class ThreadedFunction {
  private thread?: Thread
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

  private async invoke(args: unknown[]) {
    if (!this.thread) {
      const thread = await this.pool.getThread(this.execSettings.parallel)
      this.thread = thread
    }
    const task = Task.invokeFunction(this.moduleSrc, this.exportName, args)
    return await this.thread.run(task)
  }
}

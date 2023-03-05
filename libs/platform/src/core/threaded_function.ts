import { Task } from './task.js'

import type { ExecutionSettings } from '../index.d.js'
import type { Thread } from './thread.js'
import type { ThreadPool } from './thread_pool.js'

export class ThreadedFunction {
  constructor(private moduleSrc: string, private exportName: string, private thread: Thread) {}

  static async create(pool: ThreadPool, moduleSrc: string, exportName: string, execSettings: ExecutionSettings) {
    const thread = await pool.getThread(execSettings.parallel)
    return new ThreadedFunction(moduleSrc, exportName, thread)
  }

  async invoke(args: unknown[]) {
    const task = Task.invokeFunction(this.moduleSrc, this.exportName, args)
    return this.thread.run(task)
  }
}

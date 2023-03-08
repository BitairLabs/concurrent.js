import { Task } from './task.js'

import type { ExecutionSettings } from '../index.d.js'
import type { Thread } from './thread.js'
import type { ThreadPool } from './thread_pool.js'
import type { Dict, InstantiateObjectResult } from './types.js'

export class ThreadedObject {
  private constructor(
    private pool: ThreadPool,
    private thread: Thread,
    private id: number,
    public properties: Dict<string>
  ) {}

  static async create(
    pool: ThreadPool,
    moduleSrc: string,
    exportName: string,
    ctorArgs: unknown[],
    execSettings: ExecutionSettings
  ) {
    const thread = await pool.getThread(execSettings.parallel)
    const task = Task.instantiateObject(moduleSrc, exportName, ctorArgs)
    const [id, properties] = (await thread.run(task)) as InstantiateObjectResult
    const obj = new ThreadedObject(pool, thread, id, properties)

    pool.registerObject(obj, id, thread as never)

    return obj
  }

  async getProperty(propName: string) {
    const task = Task.getInstanceProperty(this.id as number, propName)
    return await this.thread.run(task)
  }

  async setProperty(propName: string, value: unknown) {
    const task = Task.setInstanceProperty(this.id as number, propName, value)
    return await this.thread.run(task)
  }

  async invoke(methodName: string, args: unknown[]) {
    const task = Task.invokeInstanceMethod(this.id as number, methodName, args)
    return await this.thread.run(task)
  }

  async dispose() {
    this.pool.unregisterObject(this)
    this.pool.disposeObject(this.id as never, this.thread as never)
  }
}

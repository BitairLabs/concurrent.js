import { Task } from './task.js'

import type { ExecutionSettings } from '../index.d.js'
import type { ThreadPool } from './thread_pool.js'

export class ThreadedFunction {
  constructor(
    private pool: ThreadPool,
    private moduleSrc: string,
    private exportName: string,
    private execSettings: ExecutionSettings
  ) {}

  async invoke(args: unknown[]) {
    const thread = await this.pool.getThread(this.execSettings.parallel)
    const task = Task.invokeFunction(this.moduleSrc, this.exportName, args)
    const result = await thread.run(task)
    if (this.execSettings.parallel) this.pool.releaseThread(thread)
    return result
  }

  async getStaticProperty(propName: string): Promise<unknown> {
    const thread = await this.pool.getThread(this.execSettings.parallel)
    const task = Task.getStaticProperty(this.moduleSrc, this.exportName, propName)
    const result = await thread.run(task)
    if (this.execSettings.parallel) this.pool.releaseThread(thread)
    return result
  }

  async setStaticProperty(propName: string, value: unknown) {
    const thread = await this.pool.getThread(this.execSettings.parallel)
    const task = Task.setStaticProperty(this.moduleSrc, this.exportName, propName, value)
    const result = await thread.run(task)
    if (this.execSettings.parallel) this.pool.releaseThread(thread)
    return result
  }

  async invokeStaticMethod(methodName: string, args: unknown[]) {
    const thread = await this.pool.getThread(this.execSettings.parallel)
    const task = Task.invokeStaticMethod(this.moduleSrc, this.exportName, methodName, args)
    const result = await thread.run(task)
    if (this.execSettings.parallel) this.pool.releaseThread(thread)
    return result
  }
}

import { TaskType } from './constants.js'
import { Task } from './task.js'

import type {
  GetStaticPropertyData,
  InvokeFunctionData,
  InvokeStaticMethodData,
  SetStaticPropertyData
} from './types.js'

import type { Thread } from './thread.js'

export class ThreadedFunction {
  constructor(private thread: Thread, private moduleSrc: string, private exportName: string) {}

  async invoke(args: unknown[]) {
    const task = new Task<InvokeFunctionData>(TaskType.InvokeFunction, [this.moduleSrc, this.exportName, args])
    const result = await this.thread.run(task)
    return result
  }

  async getStaticProperty(propName: string): Promise<unknown> {
    const task = new Task<GetStaticPropertyData>(TaskType.GetStaticProperty, [
      this.moduleSrc,
      this.exportName,
      propName
    ])
    const result = await this.thread.run(task)
    return result
  }

  async setStaticProperty(propName: string, value: unknown) {
    const task = new Task<SetStaticPropertyData>(TaskType.SetStaticProperty, [
      this.moduleSrc,
      this.exportName,
      propName,
      value
    ])
    const result = await this.thread.run(task)
    return result
  }

  async invokeStaticMethod(methodName: string, args: unknown[]) {
    const task = new Task<InvokeStaticMethodData>(TaskType.InvokeStaticMethod, [
      this.moduleSrc,
      this.exportName,
      methodName,
      args
    ])
    const result = await this.thread.run(task)
    return result
  }
}

import { TaskType } from './constants.js'
import { Task } from './task.js'
import { createObject } from './utils.js'

import type { Thread } from './thread.js'
import type {
  DisposeObjectData,
  GetInstancePropertyData,
  InstantiateObjectData,
  InstantiateObjectResult,
  InvokeInstanceMethodData,
  SetInstancePropertyData
} from './types.js'

declare type ObjectRegistryEntry = {
  id: number
  threadRef: WeakRef<Thread>
}

export class ThreadedObject {
  private static objectRegistry = new FinalizationRegistry(({ id, threadRef }: ObjectRegistryEntry) => {
    const thread = threadRef.deref()
    if (thread) {
      const task = new Task<DisposeObjectData>(TaskType.DisposeObject, [id])
      thread.run(task).finally()
    }
  })

  private constructor(private thread: Thread, private id: number, public target: object) {}

  static async create(thread: Thread, moduleSrc: string, exportName: string, ctorArgs: unknown[]) {
    const task = new Task<InstantiateObjectData>(TaskType.InstantiateObject, [moduleSrc, exportName, ctorArgs])
    const [id, properties] = (await thread.run(task)) as InstantiateObjectResult
    const obj = new ThreadedObject(thread, id, createObject(properties))

    this.objectRegistry.register(obj, { id, threadRef: new WeakRef(thread) }, obj)

    return obj
  }

  async getProperty(propName: string) {
    const task = new Task<GetInstancePropertyData>(TaskType.GetInstanceProperty, [this.id, propName])
    const result = await this.thread.run(task)
    return result
  }

  async setProperty(propName: string, value: unknown) {
    const task = new Task<SetInstancePropertyData>(TaskType.SetInstanceProperty, [this.id, propName, value])
    const result = await this.thread.run(task)
    return result
  }

  async invoke(methodName: string, args: unknown[]) {
    const task = new Task<InvokeInstanceMethodData>(TaskType.InvokeInstanceMethod, [this.id, methodName, args])
    const result = await this.thread.run(task)
    return result
  }
}

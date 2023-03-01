import { ErrorMessage, TaskType, ThreadMessageType } from './constants.js'
import { ConcurrencyError } from './error.js'

import type { Constructor, InvokeFunctionData } from './types.js'

import type {
  ThreadMessage,
  TaskInfo,
  TaskResult,
  InstantiateObjectData,
  InvokeMethodData,
  DisposeObjectData
} from './types.js'

export class WorkerManager {
  objects: Map<number, unknown> = new Map()
  lastObjectId = 0

  async handleMessage(type: ThreadMessageType, data: unknown) {
    if (type == ThreadMessageType.RunTask) {
      const [coroutineId, taskType, taskData] = data as TaskInfo
      let message: ThreadMessage
      try {
        let error, result
        switch (taskType) {
          case TaskType.InstantiateObject:
            ;[error, result] = await this.instantiateObject(...(taskData as InstantiateObjectData))
            break
          case TaskType.InvokeMethod:
            ;[error, result] = await this.invokeMethod(...(taskData as InvokeMethodData))
            break
          case TaskType.DisposeObject:
            ;[error, result] = this.disposeObject(...(taskData as DisposeObjectData))
            break
          case TaskType.InvokeFunction:
            ;[error, result] = await this.invokeFunction(...(taskData as InvokeFunctionData))
            break
          default:
            throw new ConcurrencyError(ErrorMessage.InvalidTaskType, taskType)
        }
        message = [ThreadMessageType.ReadTaskResult, [coroutineId, error, result] as TaskResult]
      } catch (error) {
        message = [ThreadMessageType.ReadTaskResult, [coroutineId, error, undefined] as TaskResult]
      }
      return message
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidMessageType, type)
    }
  }
  private async instantiateObject(moduleSrc: string, ctorName: string, ctorArgs: unknown[] = []) {
    const module = await import(moduleSrc)
    const ctor = module[ctorName] as Constructor
    const obj = new ctor(...ctorArgs)
    this.lastObjectId += 1
    this.objects.set(this.lastObjectId, obj)
    return [undefined, this.lastObjectId]
  }

  private async invokeMethod(objectId: number, name: string, args: unknown[] = []) {
    const obj = this.objects.get(objectId) as object
    if (!obj) throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId)

    let result, error
    try {
      const method = Reflect.get(obj, name)
      result = await method.apply(obj, args)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private disposeObject(objectId: number) {
    const obj = this.objects.get(objectId)
    if (!obj) throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId)

    let error
    try {
      this.objects.delete(objectId)
    } catch (err) {
      error = err
    }

    return [error, undefined]
  }

  private async invokeFunction(moduleSrc: string, functionName: string, args: unknown[] = []) {
    const module = await import(moduleSrc)

    let result, error
    try {
      const method = Reflect.get(module, functionName)
      result = await method.apply(module.exports, args)
    } catch (err) {
      error = err
    }

    return [error, result]
  }
}

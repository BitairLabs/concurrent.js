import { ErrorMessage, TaskType, ThreadMessageType, ValueType } from './constants.js'
import { ConcurrencyError } from './error.js'

import type {
  Constructor,
  Dict,
  GetInstancePropertyData,
  InstantiateObjectResult,
  InvokeFunctionData,
  SetInstancePropertyData
} from './types.js'

import type {
  ThreadMessage,
  TaskInfo,
  TaskResult,
  InstantiateObjectData,
  InvokeInstanceMethodData,
  DisposeObjectData
} from './types.js'
import { isFunction, isSymbol } from './utils.js'

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
          case TaskType.GetInstanceProperty:
            ;[error, result] = await this.getInstanceProperty(...(taskData as GetInstancePropertyData))
            break
          case TaskType.SetInstanceProperty:
            ;[error, result] = await this.setInstanceProperty(...(taskData as SetInstancePropertyData))
            break
          case TaskType.InvokeInstanceMethod:
            ;[error, result] = await this.invokeInstanceMethod(...(taskData as InvokeInstanceMethodData))
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
        message = [
          ThreadMessageType.ReadTaskResult,
          [
            coroutineId,
            { message: (error as ConcurrencyError).message, code: (error as ConcurrencyError).code },
            undefined
          ] as TaskResult
        ]
      }
      return message
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidMessageType, type)
    }
  }

  private async instantiateObject(moduleSrc: string, exportName: string, ctorArgs: unknown[] = []) {
    const module = await import(moduleSrc)
    const ctor = module[exportName] as Constructor
    const obj = new ctor(...ctorArgs)
    this.lastObjectId += 1
    this.objects.set(this.lastObjectId, obj)
    const result = [this.lastObjectId, getPropertyTypeMap(obj)] as InstantiateObjectResult
    return [undefined, result]
  }

  private async getInstanceProperty(objectId: number, name: string) {
    const obj = this.objects.get(objectId) as object
    if (!obj) throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId)

    let result, error
    try {
      result = Reflect.get(obj, name)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async setInstanceProperty(objectId: number, name: string, value: unknown) {
    const obj = this.objects.get(objectId) as object
    if (!obj) throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId)

    let result, error
    try {
      result = Reflect.set(obj, name, value)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async invokeInstanceMethod(objectId: number, name: string, args: unknown[] = []) {
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

function getPropertyTypeMap(obj: unknown) {
  const map: Dict<number> = {}
  while (obj) {
    const keys = Reflect.ownKeys(obj)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i] as never
      if (!isSymbol(key)) {
        if (!map[key]) {
          const descriptor = Reflect.getOwnPropertyDescriptor(obj, key) as PropertyDescriptor
          map[key] = isFunction(descriptor.value) ? ValueType.Function : ValueType.Any
        }
      }
    }
    obj = Reflect.getPrototypeOf(obj)
  }
  return map
}

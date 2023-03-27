import { ErrorMessage, TaskType, ThreadMessageType } from './constants.js'
import { ConcurrencyError } from './error.js'
import { getProperties, isNativeModule } from './utils.js'

import type {
  GetInstancePropertyData,
  GetStaticPropertyData,
  InstantiateObjectResult,
  InteropHandler,
  InvokeFunctionData,
  InvokeStaticMethodData,
  SetInstancePropertyData,
  SetStaticPropertyData
} from './types.js'

import type {
  ThreadMessage,
  TaskInfo,
  TaskResult,
  InstantiateObjectData,
  InvokeInstanceMethodData,
  DisposeObjectData
} from './types.js'

export class WorkerManager {
  objects: Map<number, unknown> = new Map()
  lastObjectId = 0

  constructor(private interopHandler: InteropHandler) {}

  async handleMessage(type: ThreadMessageType, data: unknown) {
    if (type == ThreadMessageType.RunTask) {
      const [coroutineId, taskType, taskData] = data as TaskInfo
      let message: ThreadMessage
      try {
        let error, result
        switch (taskType) {
          case TaskType.InvokeFunction:
            ;[error, result] = await this.invokeFunction(...(taskData as InvokeFunctionData))
            break
          case TaskType.GetStaticProperty:
            ;[error, result] = await this.getStaticProperty(...(taskData as GetStaticPropertyData))
            break
          case TaskType.SetStaticProperty:
            ;[error, result] = await this.setStaticProperty(...(taskData as SetStaticPropertyData))
            break
          case TaskType.InvokeStaticMethod:
            ;[error, result] = await this.invokeStaticMethod(...(taskData as InvokeStaticMethodData))
            break
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

  private async invokeFunction(moduleSrc: string, functionName: string, args: unknown[] = []) {
    let result, error

    try {
      if (!isNativeModule(moduleSrc)) {
        result = await this.interopHandler.run(moduleSrc, functionName, args)
      } else {
        const module = await import(moduleSrc)
        const method = Reflect.get(module, functionName)
        result = await method.apply(module.exports, args)
      }
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async getStaticProperty(moduleSrc: string, exportName: string, propName: string) {
    let result, error

    try {
      const module = await import(moduleSrc)
      const _export = Reflect.get(module, exportName)
      result = Reflect.get(_export, propName)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async setStaticProperty(moduleSrc: string, exportName: string, propName: string, value: unknown) {
    let result, error

    try {
      const module = await import(moduleSrc)
      const _export = Reflect.get(module, exportName)
      result = Reflect.set(_export, propName, value)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async invokeStaticMethod(moduleSrc: string, exportName: string, methodName: string, args: unknown[] = []) {
    let result, error

    try {
      const module = await import(moduleSrc)
      const _export = Reflect.get(module, exportName)
      const method = Reflect.get(_export, methodName)
      result = await Reflect.apply(method, _export, args)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async instantiateObject(moduleSrc: string, exportName: string, args: unknown[] = []) {
    let result, error

    try {
      const module = await import(moduleSrc)
      const ctor = Reflect.get(module, exportName)
      const obj = Reflect.construct(ctor, args)
      this.lastObjectId += 1
      this.objects.set(this.lastObjectId, obj)
      result = [this.lastObjectId, getProperties(obj)] as InstantiateObjectResult
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async getInstanceProperty(objectId: number, propName: string) {
    const obj = this.objects.get(objectId) as object
    if (!obj) throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId)

    let result, error
    try {
      result = Reflect.get(obj, propName)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async setInstanceProperty(objectId: number, propName: string, value: unknown) {
    const obj = this.objects.get(objectId) as object
    if (!obj) throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId)

    let result, error
    try {
      result = Reflect.set(obj, propName, value)
    } catch (err) {
      error = err
    }

    return [error, result]
  }

  private async invokeInstanceMethod(objectId: number, methodName: string, args: unknown[] = []) {
    const obj = this.objects.get(objectId) as object
    if (!obj) throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId)

    let result, error
    try {
      const method = Reflect.get(obj, methodName)
      result = await Reflect.apply(method, obj, args)
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
}

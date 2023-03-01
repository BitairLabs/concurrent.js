import { TaskType } from './constants.js'

import type { InstantiateObjectData, DisposeObjectData, InvokeMethodData, InvokeFunctionData } from './types.js'

export class Task {
  private constructor(public type: TaskType, public data: unknown[]) {}

  static instantiateObject(moduleSrc: string, ctorName: string, ctorArgs: unknown[]) {
    const data: InstantiateObjectData = [moduleSrc, ctorName, ctorArgs]
    return new Task(TaskType.InstantiateObject, data)
  }

  static invokeMethod(objectId: number, methodName: string, args: unknown[]) {
    const data: InvokeMethodData = [objectId, methodName, args]
    return new Task(TaskType.InvokeMethod, data)
  }

  static disposeObject(objectId: number) {
    const data: DisposeObjectData = [objectId]
    return new Task(TaskType.DisposeObject, data)
  }

  static invokeFunction(moduleSrc: string, functionName: string, args: unknown[]) {
    const data: InvokeFunctionData = [moduleSrc, functionName, args]
    return new Task(TaskType.InvokeFunction, data)
  }
}

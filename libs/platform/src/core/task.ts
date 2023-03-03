import { TaskType } from './constants.js'

import type {
  InstantiateObjectData,
  DisposeObjectData,
  InvokeInstanceMethodData,
  InvokeFunctionData,
  GetInstancePropertyData,
  SetInstancePropertyData
} from './types.js'

export class Task {
  private constructor(public type: TaskType, public data: unknown[]) {}

  static instantiateObject(moduleSrc: string, exportName: string, ctorArgs: unknown[]) {
    const data: InstantiateObjectData = [moduleSrc, exportName, ctorArgs]
    return new Task(TaskType.InstantiateObject, data)
  }

  static getInstanceProperty(objectId: number, propName: string) {
    const data: GetInstancePropertyData = [objectId, propName]
    return new Task(TaskType.GetInstanceProperty, data)
  }

  static setInstanceProperty(objectId: number, propName: string, value: unknown) {
    const data: SetInstancePropertyData = [objectId, propName, value]
    return new Task(TaskType.SetInstanceProperty, data)
  }

  static invokeInstanceMethod(objectId: number, methodName: string, args: unknown[]) {
    const data: InvokeInstanceMethodData = [objectId, methodName, args]
    return new Task(TaskType.InvokeInstanceMethod, data)
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

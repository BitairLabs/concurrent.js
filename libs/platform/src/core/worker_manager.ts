import { Channel } from './channel.js'
import { getTaskArgs, hasChannel } from './common.js'
import { ErrorMessage, TaskType, ThreadMessageType } from './constants.js'
import { ConcurrencyError } from './error.js'
import { getProperties } from './utils.js'

import type {
  CoroutineMessage,
  CoroutineMessageInfo,
  CoroutineMessageReply,
  GetInstancePropertyData,
  GetStaticPropertyData,
  IWorker,
  InstantiateObjectResult,
  InvokeFunctionData,
  InvokeStaticMethodData,
  MessageReply,
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
  channels: Map<number, Channel> = new Map()
  lastObjectId = 0

  async handleMessage(type: ThreadMessageType, data: unknown, worker: Pick<IWorker, 'postMessage'>) {
    let reply: ThreadMessage | null = null
    if (type === ThreadMessageType.Task) {
      const [coroutineId, taskType, taskData] = data as TaskInfo
      const [error, result] = await this.handleTask(coroutineId, taskType, taskData, worker)
      reply = [ThreadMessageType.TaskCompleted, [coroutineId, error, result] as TaskResult]
    } else if (type === ThreadMessageType.DirectMessage) {
      const [coroutineId, message] = data as CoroutineMessage
      const [error, result] = await this.handleDirectMessage(coroutineId, message)
      reply = [
        ThreadMessageType.DirectMessageReplied,
        [coroutineId, [message[0], error, result]] as CoroutineMessageReply
      ]
    } else if (type === ThreadMessageType.DirectMessageReplied) {
      const [coroutineId, messageReply] = data as CoroutineMessageReply
      await this.handleDirectMessageReply(coroutineId, messageReply)
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidThreadMessageType, type)
    }
    return reply
  }

  private async handleTask(coroutineId: number, type: TaskType, data: unknown[], worker: Pick<IWorker, 'postMessage'>) {
    const channel = this.prepareChannelIfAny(type, data, worker, coroutineId)
    let error, result
    switch (type) {
      case TaskType.InvokeFunction:
        ;[error, result] = await this.invokeFunction(...(data as InvokeFunctionData))
        break
      case TaskType.GetStaticProperty:
        ;[error, result] = await this.getStaticProperty(...(data as GetStaticPropertyData))
        break
      case TaskType.SetStaticProperty:
        ;[error, result] = await this.setStaticProperty(...(data as SetStaticPropertyData))
        break
      case TaskType.InvokeStaticMethod:
        ;[error, result] = await this.invokeStaticMethod(...(data as InvokeStaticMethodData))
        break
      case TaskType.InstantiateObject:
        ;[error, result] = await this.instantiateObject(...(data as InstantiateObjectData))
        break
      case TaskType.GetInstanceProperty:
        ;[error, result] = await this.getInstanceProperty(...(data as GetInstancePropertyData))
        break
      case TaskType.SetInstanceProperty:
        ;[error, result] = await this.setInstanceProperty(...(data as SetInstancePropertyData))
        break
      case TaskType.InvokeInstanceMethod:
        ;[error, result] = await this.invokeInstanceMethod(...(data as InvokeInstanceMethodData))
        break
      case TaskType.DisposeObject:
        ;[error, result] = this.disposeObject(...(data as DisposeObjectData))
        break
      default:
        error = new ConcurrencyError(ErrorMessage.InvalidTaskType, type)
    }
    if (channel) this.channels.delete(coroutineId)
    return [error, result]
  }

  async handleDirectMessage(coroutineId: number, message: CoroutineMessageInfo) {
    const channel = this.channels.get(coroutineId)
    if (!channel) throw new ConcurrencyError(ErrorMessage.ChannelNotFound, coroutineId)
    let result, error
    try {
      result = await channel.handleMessage(message[1], message[2])
    } catch (err) {
      error = err
    }
    return [error, result]
  }

  private async handleDirectMessageReply(coroutineId: number, reply: MessageReply) {
    const channel = this.channels.get(coroutineId)
    if (!channel) throw new ConcurrencyError(ErrorMessage.ChannelNotFound, coroutineId)
    await channel.handleMessageReply(reply)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async invokeFunction(moduleSrc: string, functionName: string, args: unknown[] = [], _hasChannel?: boolean) {
    let result, error

    try {
      const module = await import(moduleSrc)
      const method = Reflect.get(module, functionName)
      result = await method.apply(module.exports, args)
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

  private async invokeStaticMethod(
    moduleSrc: string,
    exportName: string,
    methodName: string,
    args: unknown[] = [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _hasChannel?: boolean
  ) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  private async invokeInstanceMethod(
    objectId: number,
    methodName: string,
    args: unknown[] = [],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _hasChannel?: boolean
  ) {
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

  private prepareChannelIfAny(
    type: TaskType,
    data: unknown[],
    worker: Pick<IWorker, 'postMessage'>,
    coroutineId: number
  ) {
    let channel
    if (hasChannel(type, data)) {
      channel = new Channel(() => undefined)
      channel.init(worker, coroutineId)
      this.channels.set(coroutineId, channel)
      const args = getTaskArgs(type, data)
      args.push(channel)
    }
    return channel
  }
}

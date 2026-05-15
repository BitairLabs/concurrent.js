import { Channel } from './channel.js'
import { getChannelFlagIndex, getTaskArgs, isInvocableTask } from './common.js'
import { ErrorMessage, TaskType, ThreadMessageType } from './constants.js'
import { Coroutine } from './coroutine.js'
import { ConcurrencyError } from './error.js'

import type { Task } from './task.js'

import type {
  ThreadMessage,
  TaskResult,
  TaskInfo,
  IWorker,
  IWorkerFactory,
  CoroutineMessage,
  CoroutineMessageReply
} from './types.js'

export class Thread {
  private coroutines: Map<number, Coroutine> = new Map()
  private worker: IWorker
  private terminated = false

  constructor(private workerFactory: IWorkerFactory) {
    this.worker = workerFactory.create()
    this.initWorker()
  }

  async run(task: Task<unknown[]>) {
    if (this.terminated) throw new ConcurrencyError(ErrorMessage.ThreadTerminated)

    const result = new Promise((resolve, reject) => {
      const channel = isInvocableTask(task.type) ? this.prepareChannelIfAny(task.type, task.data) : undefined
      const coroutine = Coroutine.create((error: Error | undefined, result: unknown) => {
        this.coroutines.delete(coroutine.id)
        if (error) reject(error)
        else resolve(result)
      }, channel)

      if (channel) channel.init(this.worker, coroutine.id)

      const taskInfo = [coroutine.id, task.type, task.data] as TaskInfo
      this.coroutines.set(coroutine.id, coroutine)
      this.worker.postMessage([ThreadMessageType.Task, taskInfo])
    })
    return result
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async terminate(_force = false) {
    // TODO: terminate gracefully
    this.terminated = true
    this.coroutines.clear()
    this.worker.terminate()
  }

  private initWorker() {
    this.worker.onmessage(async (message: ThreadMessage) => {
      await this.handleMessage(message)
    })
    this.worker.onerror((error: Error) => {
      for (const coroutine of this.coroutines.values()) {
        coroutine.done(new ConcurrencyError(ErrorMessage.InternalError), undefined)
      }
      this.worker = this.workerFactory.create()
      throw error
    })
  }

  private async handleMessage([type, data]: ThreadMessage) {
    if (type === ThreadMessageType.TaskCompleted) {
      const [coroutineId, error, result] = data as TaskResult
      const coroutine = this.coroutines.get(coroutineId)
      if (!coroutine) throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId)
      coroutine.done(error as Error, result)
    } else if (type === ThreadMessageType.DirectMessage) {
      const [coroutineId, message] = data as CoroutineMessage
      const coroutine = this.coroutines.get(coroutineId)
      if (!coroutine) throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId)
      if (coroutine.channel) {
        let result, error
        try {
          result = await coroutine.channel.handleMessage(message[1], message[2])
        } catch (err) {
          error = err
        }
        this.worker.postMessage([
          ThreadMessageType.DirectMessageReplied,
          [coroutine.id, [message[0], error, result]] as CoroutineMessageReply
        ])
      }
    } else if (type === ThreadMessageType.DirectMessageReplied) {
      const [coroutineId, reply] = data as CoroutineMessageReply
      const coroutine = this.coroutines.get(coroutineId)
      if (!coroutine) throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId)
      if (coroutine.channel) {
        await coroutine.channel.handleMessageReply(reply)
      }
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidThreadMessageType, type)
    }
  }

  private prepareChannelIfAny(type: TaskType, data: unknown[]) {
    let channel: Channel | undefined = undefined
    const args = getTaskArgs(type, data)
    if (args.findIndex(arg => arg instanceof Channel) > 1)
      throw new ConcurrencyError(ErrorMessage.TooManyChannelProvided)
    const channelArgIndex = args.findIndex(arg => arg instanceof Channel)
    if (channelArgIndex >= 0) {
      channel = args[channelArgIndex] as Channel
      if (channel.initialized) throw new ConcurrencyError(ErrorMessage.UsedChannelProvided)
      args.splice(channelArgIndex)
      data[getChannelFlagIndex(type)] = true
    }
    return channel
  }
}

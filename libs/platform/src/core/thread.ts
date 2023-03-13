import { ErrorMessage, ThreadMessageType } from './constants.js'
import { Coroutine } from './coroutine.js'
import { ConcurrencyError } from './error.js'

import type { Task } from './task.js'

import type { ThreadMessage, TaskResult, TaskInfo, IWorker, IWorkerFactory } from './types.js'

export class Thread {
  private coroutines: Map<number, Coroutine> = new Map()
  private worker: IWorker
  private terminated = false
  locked = false
  refs = 0

  constructor(private workerFactory: IWorkerFactory) {
    this.worker = workerFactory.create()
    this.initWorker()
  }

  async run(task: Task<unknown[]>) {
    if (this.terminated) throw new ConcurrencyError(ErrorMessage.ThreadTerminated)

    const result = new Promise((resolve, reject) => {
      const coroutine = Coroutine.create((error: Error | undefined, result: unknown) => {
        this.coroutines.delete(coroutine.id)
        if (error) reject(error)
        else resolve(result)
      })

      const taskInfo = [coroutine.id, task.type, task.data] as TaskInfo
      this.coroutines.set(coroutine.id, coroutine)
      const message: ThreadMessage = [ThreadMessageType.RunTask, taskInfo]
      this.postMessage(message)
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
    this.worker.onmessage((message: ThreadMessage) => {
      this.handleMessage(message)
    })
    this.worker.onerror((error: Error) => {
      for (const coroutine of this.coroutines.values()) {
        coroutine.done(new ConcurrencyError(ErrorMessage.InternalError), undefined)
      }
      this.worker = this.workerFactory.create()
      throw error
    })
  }

  private postMessage(message: [ThreadMessageType, unknown]) {
    this.worker.postMessage(message)
  }

  private handleMessage([type, data]: ThreadMessage) {
    if (type === ThreadMessageType.ReadTaskResult) {
      const [coroutineId, error, result] = data as TaskResult
      const coroutine = this.coroutines.get(coroutineId)
      if (!coroutine) throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId)
      coroutine.done(error as Error, result)
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidMessageType, type)
    }
  }
}

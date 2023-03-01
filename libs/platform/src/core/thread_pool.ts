import { Thread } from './thread.js'

import type { ConcurrencySettings, ThreadPoolSettings } from '../index.d.js'
import type { Constructor, IWorkerFactory } from './types.js'
import type { ThreadedObject } from './threaded_object.js'
import { Task } from './task.js'
import { ConcurrencyError } from './error.js'
import { ErrorMessage } from './constants.js'

declare type AllocationRequest = {
  time: number
  exclusive: boolean
  callback(thread: Thread | undefined, error?: ConcurrencyError): void
}

declare type ObjectRegistryEntry = {
  id: number
  threadRef: WeakRef<Thread>
}

export class ThreadPool {
  private turn = 0
  private threads: Thread[] = []
  private requests: Set<AllocationRequest> = new Set()
  private totalThreads = 0
  private timer: NodeJS.Timer
  private objectRegistry: FinalizationRegistry<ObjectRegistryEntry>

  constructor(private workerFactory: IWorkerFactory, private settings: ConcurrencySettings) {
    if (this.settings.minThreads) {
      for (let i = 0; i < this.settings.minThreads; i++) {
        this.addThread()
      }
    }

    this.objectRegistry = new FinalizationRegistry(({ id, threadRef }: ObjectRegistryEntry) => {
      const thread = threadRef.deref()
      if (thread) this.disposeObject(id, thread)
    })

    this.timer = setInterval(() => {
      this.allocate()
    })
    // TODO: descale automatically
  }

  config(settings: ThreadPoolSettings) {
    Object.assign(this.settings, settings)
  }

  async getThread(exclusive: boolean): Promise<Thread> {
    if (this.totalThreads < this.settings.maxThreads) this.addThread()

    const thread = await new Promise((resolve, reject) => {
      const callback = (thread: Thread, error: ConcurrencyError) => {
        if (error) reject(error)
        else resolve(thread)
      }
      this.requests.add({ time: performance.now(), exclusive, callback })
    })

    return thread as never
  }

  registerObject<T extends ThreadedObject<Constructor>>(object: T, id: number, thread: Thread) {
    this.objectRegistry.register(
      object,
      {
        id,
        threadRef: new WeakRef(thread)
      },
      object
    )
  }

  unregisterObject<T extends ThreadedObject<Constructor>>(object: T) {
    this.objectRegistry.unregister(object)
  }

  async disposeObject(id: number, thread: Thread) {
    const task = Task.disposeObject(id)
    await thread.run(task)
    if (thread.locked) thread.locked = false
  }

  async descale(force: boolean) {
    for (const thread of this.threads) {
      if (this.threads.length <= this.settings.minThreads) break

      await thread.terminate(force)
      this.threads.pop()
      this.totalThreads -= 1
    }
  }

  async terminate(force: boolean) {
    for (let i = 0; i < this.threads.length; i++) {
      const thread = this.threads[i] as Thread
      await thread.terminate(force)
    }

    clearInterval(this.timer)
  }

  private allocate() {
    for (const request of this.requests) {
      const { callback, exclusive, time } = request
      const timeout = this.settings.threadAllocationTimeout
      if (timeout !== Infinity && performance.now() > time + timeout) {
        this.requests.delete(request)
        callback(undefined, new ConcurrencyError(ErrorMessage.ThreadAllocationTimeout))
      } else {
        const thread = this.selectThread(exclusive) as never
        if (thread) {
          this.requests.delete(request)
          callback(thread)
        }
      }
    }
  }

  private addThread() {
    const thread = new Thread(this.workerFactory)
    this.threads.push(thread)
    this.totalThreads += 1
  }

  private selectThread(exclusive?: boolean): Thread | undefined {
    if (this.turn > this.threads.length - 1) this.turn = 0

    let thread
    for (let i = this.turn; i < this.threads.length; i++) {
      const _thread = this.threads[i] as Thread
      if (!_thread.locked) {
        thread = _thread
        break
      }
      this.turn += 1
    }

    if (thread && exclusive) thread.locked = true

    return thread
  }
}

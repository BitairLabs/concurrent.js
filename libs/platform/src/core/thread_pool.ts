import { ErrorMessage } from './constants.js'
import { ConcurrencyError } from './error.js'
import { Thread } from './thread.js'

import type { ThreadPoolSettings } from '../index.d.js'
import type { IWorkerFactory } from './types.js'

export class ThreadPool {
  private turn = 0
  private threads: Thread[] = []
  private terminated = false

  constructor(private workerFactory: IWorkerFactory, private settings: ThreadPoolSettings) {
    if (this.settings.minThreads) {
      for (let i = 0; i < this.settings.minThreads; i++) {
        this.addThread()
      }
    }

    // TODO: descale
  }

  config(settings: Partial<ThreadPoolSettings>) {
    Object.assign(this.settings, settings)
  }

  async getThread(): Promise<Thread> {
    if (this.terminated) throw new ConcurrencyError(ErrorMessage.ThreadPoolTerminated)

    if (this.threads.length < this.settings.maxThreads) this.addThread()

    if (this.turn > this.threads.length - 1) this.turn = 0

    const thread = this.threads[this.turn] as Thread
    this.turn += 1

    return thread
  }

  async terminate(force = false) {
    for (let i = 0; i < this.threads.length; i++) {
      const thread = this.threads[i] as Thread
      await thread.terminate(force)
    }

    this.threads = []
    this.terminated = true
  }

  private addThread() {
    const thread = new Thread(this.workerFactory)
    this.threads.push(thread)
  }
}

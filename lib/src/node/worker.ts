import { Worker } from 'worker_threads'

import type { ThreadMessage } from '../core/types.js'
import { WorkerBase } from '../core/worker_base.js'

export class NodeWorker extends WorkerBase<Worker> {
  constructor(scriptSrc: string | URL) {
    const worker = new Worker(scriptSrc)
    super(worker)

    worker.on('message', (message: ThreadMessage) => {
      if (this.messageHandler) this.messageHandler(message)
    })
    worker.on('error', (error: Error) => {
      if (this.errorHandler) this.errorHandler(error)
    })
  }
}

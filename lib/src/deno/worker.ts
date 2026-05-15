import { WorkerBase } from '../core/worker_base.js'

export class DenoWorker extends WorkerBase<Worker> {
  constructor(scriptSrc: string | URL) {
    const worker = new Worker(new URL(scriptSrc).href, { type: 'module' })
    super(worker)
    worker.onmessage = e => {
      if (this.messageHandler) this.messageHandler(e.data)
    }
    worker.onerror = (error: ErrorEvent) => {
      if (this.errorHandler) this.errorHandler(error.error)
    }
  }
}

import { ConcurrencyError, Constants } from '../core/index.js'

import { WorkerBase } from '../core/worker_base.js'

export class BrowserWorker extends WorkerBase<Worker> {
  constructor(scriptSrc: string | URL) {
    if (!window.Worker) throw new ConcurrencyError(Constants.ErrorMessage.WorkerNotSupported)

    const worker = new Worker(scriptSrc)
    super(worker)

    worker.onmessage = e => {
      if (this.messageHandler) this.messageHandler(e.data)
    }
    worker.onerror = (error: ErrorEvent) => {
      if (this.errorHandler) this.errorHandler(error.error)
    }
  }
}

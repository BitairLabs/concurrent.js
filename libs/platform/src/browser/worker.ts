import { ConcurrencyError, Constants } from '../core/index.js'

import type { IWorker, WorkerMessageHandler, WorkerErrorHandler, ThreadMessage } from '../core/types.js'

export class BrowserWorker implements IWorker {
  private _worker: Worker
  private messageHandler?: WorkerMessageHandler
  private errorHandler?: WorkerErrorHandler

  constructor(scriptSrc: string | URL) {
    if (!window.Worker) throw new ConcurrencyError(Constants.ErrorMessage.WorkerNotSupported)

    this._worker = new Worker(scriptSrc)
    this._worker.onmessage = e => {
      if (this.messageHandler) this.messageHandler(e.data)
    }
    this._worker.onerror = (error: ErrorEvent) => {
      if (this.errorHandler) this.errorHandler(error.error)
    }
  }

  postMessage(message: ThreadMessage) {
    this._worker.postMessage(message)
  }

  onmessage(handler: WorkerMessageHandler) {
    this.messageHandler = handler
  }

  onerror(handler: WorkerErrorHandler) {
    this.errorHandler = handler
  }

  terminate() {
    this._worker.terminate()
  }
}

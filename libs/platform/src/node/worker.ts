import { Worker } from 'worker_threads'

import type { IWorker, WorkerMessageHandler, WorkerErrorHandler, ThreadMessage } from '../core/types.js'

export class NodeWorker implements IWorker {
  private _worker: Worker
  private messageHandler?: WorkerMessageHandler
  private errorHandler?: WorkerErrorHandler

  constructor(scriptSrc: string | URL) {
    this._worker = new Worker(scriptSrc)
    this._worker.on('message', (message: ThreadMessage) => {
      if (this.messageHandler) this.messageHandler(message)
    })
    this._worker.on('error', error => {
      if (this.errorHandler) this.errorHandler(error)
    })
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

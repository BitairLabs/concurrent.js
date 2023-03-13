import type { IWorker, ThreadMessage, WorkerErrorHandler, WorkerMessageHandler } from './types.js'

export class WorkerBase<T extends { postMessage: (message: unknown) => void; terminate: () => unknown }>
  implements IWorker
{
  protected messageHandler?: WorkerMessageHandler
  protected errorHandler?: WorkerErrorHandler

  constructor(private _worker: T) {}

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

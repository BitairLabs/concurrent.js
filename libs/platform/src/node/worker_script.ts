import { parentPort } from 'node:worker_threads'

import { ConcurrencyError, Constants, WorkerManager } from '../core/index.js'

import type { ThreadMessage } from '../core/types.js'

const manager = new WorkerManager()

if (!parentPort) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)

parentPort.on('message', async ([type, data]: ThreadMessage) => {
  if (!parentPort) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)
  const reply = await manager.handleMessage(type, data, {
    postMessage: (message: ThreadMessage) => {
      if (!parentPort) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)
      parentPort.postMessage(message)
    }
  })
  if (reply) parentPort.postMessage(reply)
})

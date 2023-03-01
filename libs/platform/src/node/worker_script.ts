import { ConcurrencyError, Constants, WorkerManager } from '../core/index.js'
import { parentPort } from 'node:worker_threads'

import type { ThreadMessage } from '../core/types.js'

const manager = new WorkerManager()
if (!parentPort) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)

parentPort.on('message', async ([type, data]: ThreadMessage) => {
  const reply = await manager.handleMessage(type, data)
  if (parentPort) parentPort.postMessage(reply)
})

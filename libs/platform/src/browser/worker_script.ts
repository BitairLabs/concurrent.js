import { ConcurrencyError, Constants, WorkerManager } from '../core/index.js'

import type { ThreadMessage } from '../core/types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((this as any)?.document) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)

const manager = new WorkerManager()

onmessage = function (e) {
  const [type, data]: ThreadMessage = e.data
  manager.handleMessage(type, data).then(reply => {
    postMessage(reply)
  })
}

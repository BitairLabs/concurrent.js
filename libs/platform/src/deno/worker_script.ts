import { ConcurrencyError, Constants, WorkerManager } from '../core/index.js'

import type { ThreadMessage } from '../core/types.js'

if (self.document) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)

const manager = new WorkerManager()

onmessage = function (e) {
  const [type, data]: ThreadMessage = e.data
  manager
    .handleMessage(type, data, {
      postMessage: (message: ThreadMessage) => {
        postMessage(message)
      }
    })
    .then(reply => {
      if (reply) postMessage(reply)
    })
}

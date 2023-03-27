import { ErrorMessage, ModuleExt } from '../core/constants.js'
import { ConcurrencyError, Constants, WorkerManager } from '../core/index.js'
import { WasmInteropHandler } from '../core/interop/wasm.js'

import type { ThreadMessage } from '../core/types.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((this as any)?.document) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)

const wasmInteropHandler = new WasmInteropHandler(async (moduleSrc: string) => {
  const { instance } = await WebAssembly.instantiateStreaming(fetch(moduleSrc))
  return instance
})

const manager = new WorkerManager({
  run(moduleSrc: string, functionName: string, args: unknown[]) {
    if (moduleSrc.endsWith(ModuleExt.WASM)) return wasmInteropHandler.run(moduleSrc, functionName, args)
    else throw new ConcurrencyError(ErrorMessage.UnrecognizedModuleType, moduleSrc)
  }
})

onmessage = function (e) {
  const [type, data]: ThreadMessage = e.data
  manager.handleMessage(type, data).then(reply => {
    postMessage(reply)
  })
}

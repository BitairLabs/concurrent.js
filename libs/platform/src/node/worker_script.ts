import fs from 'fs'
import { parentPort } from 'node:worker_threads'
import { promisify } from 'util'

import { ErrorMessage, ModuleExt } from '../core/constants.js'
import { ConcurrencyError, Constants, WorkerManager } from '../core/index.js'
import { WasmInteropHandler } from '../core/interop/wasm.js'

import type { ThreadMessage } from '../core/types.js'

const wasmInteropHandler = new WasmInteropHandler(async (moduleSrc: string) => {
  const wasmBuffer = await promisify(fs.readFile)(moduleSrc.replace('file://', ''))
  const module = await WebAssembly.instantiate(wasmBuffer)
  return module.instance
})

const manager = new WorkerManager({
  run(moduleSrc: string, functionName: string, args: unknown[]) {
    if (moduleSrc.endsWith(ModuleExt.WASM)) return wasmInteropHandler.run(moduleSrc, functionName, args)
    else throw new ConcurrencyError(ErrorMessage.UnrecognizedModuleType, moduleSrc)
  }
})

if (!parentPort) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)

parentPort.on('message', async ([type, data]: ThreadMessage) => {
  const reply = await manager.handleMessage(type, data)
  if (parentPort) parentPort.postMessage(reply)
})

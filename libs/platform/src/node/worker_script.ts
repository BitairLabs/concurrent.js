import { link } from '@bitair/linker.js'
import fs from 'fs'
import { parentPort } from 'node:worker_threads'
import { promisify } from 'util'

import { ErrorMessage, ModuleExt } from '../core/constants.js'
import { ConcurrencyError, Constants, WorkerManager } from '../core/index.js'
import { ExternInteropHandler } from '../core/interop/extern.js'
import { WasmInteropHandler } from '../core/interop/wasm.js'

import type { ExternLibProxy, ExternLibExports, ThreadMessage } from '../core/types.js'
import { isExternModule } from '../core/utils.js'

const wasmInteropHandler = new WasmInteropHandler(async (moduleSrc: string) => {
  const wasmBuffer = await promisify(fs.readFile)(moduleSrc.replace('file://', ''))
  const module = await WebAssembly.instantiate(wasmBuffer)
  return module.instance
})

const cInteropHandler = new ExternInteropHandler((moduleSrc: string, functions: ExternLibExports): ExternLibProxy => {
  return link(moduleSrc.replace('file://', ''), functions as never)
})

const manager = new WorkerManager({
  run(moduleSrc: string, functionName: string, args: unknown[]) {
    if (moduleSrc.endsWith(ModuleExt.WASM)) return wasmInteropHandler.run(moduleSrc, functionName, args)
    else if (isExternModule(moduleSrc)) return cInteropHandler.run(moduleSrc, functionName, args)
    else throw new ConcurrencyError(ErrorMessage.UnrecognizedModuleType, moduleSrc)
  }
})

if (!parentPort) throw new ConcurrencyError(Constants.ErrorMessage.NotRunningOnWorker)

parentPort.on('message', async ([type, data]: ThreadMessage) => {
  const reply = await manager.handleMessage(type, data)
  if (parentPort) parentPort.postMessage(reply)
})

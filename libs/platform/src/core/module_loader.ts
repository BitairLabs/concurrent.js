import { ThreadedObject } from './threaded_object.js'
import { isFunction } from './utils.js'

import type { Constructor, Dict } from './types.js'
import type { ExecutionSettings } from '../index.d.js'
import type { ThreadPool } from './thread_pool.js'
import { ThreadedFunction } from './threaded_function.js'

export class ModuleLoader {
  constructor(private pool: ThreadPool) {}

  async load(moduleSrc: string, execSettings: ExecutionSettings) {
    const exports = await import(moduleSrc)

    const proxy: Dict<unknown> = {}

    for (const exportName in exports) {
      if (Object.prototype.hasOwnProperty.call(exports, exportName)) {
        const _export = exports[exportName]
        if (isFunction(_export)) {
          proxy[exportName] = this.createProxy(moduleSrc, exportName, _export, execSettings)
        } else {
          proxy[exportName] = _export
        }
      }
    }

    return proxy
  }

  createProxy(moduleSrc: string, exportName: string, ctor: Constructor, execSettings: ExecutionSettings) {
    const pool = this.pool
    return function ExportProxy(...params: unknown[]) {
      if (new.target) {
        const obj = new ThreadedObject(pool, moduleSrc, exportName, ctor, params, execSettings)
        return obj.proxy
      } else {
        const fn = new ThreadedFunction(pool, moduleSrc, exportName, execSettings)
        return fn.proxy.invoke(params)
      }
    }
  }
}

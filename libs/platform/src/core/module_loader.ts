import { ThreadedObject } from './threaded_object.js'
import { isFunction } from './utils.js'

import type { Dict } from './types.js'
import type { ExecutionSettings } from '../index.d.js'
import type { ThreadPool } from './thread_pool.js'
import { ThreadedFunction } from './threaded_function.js'

export class ModuleLoader {
  constructor(private pool: ThreadPool) {}

  async load(moduleSrc: string, execSettings: ExecutionSettings) {
    const exports = await import(moduleSrc)

    const proxy: Dict<unknown> = {}

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _this = this
    for (const exportName in exports) {
      if (Object.prototype.hasOwnProperty.call(exports, exportName)) {
        const _export = exports[exportName]
        if (isFunction(_export)) {
          proxy[exportName] = function ExportProxy(...params: unknown[]) {
            if (new.target) {
              const obj = new ThreadedObject(_this.pool, moduleSrc, exportName, _export, params, execSettings)
              return obj.proxy
            } else {
              const fn = new ThreadedFunction(_this.pool, moduleSrc, exportName, execSettings)
              return fn.proxy.invoke(params)
            }
          }
        } else {
          proxy[exportName] = _export
        }
      }
    }

    return proxy
  }
}

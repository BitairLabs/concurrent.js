import { ErrorMessage } from '../constants.js'
import { ConcurrencyError } from '../error.js'
import type { IInteropHandler } from '../types.js'

export class WasmInteropHandler implements IInteropHandler {
  constructor(private createInstance: (moduleSrc: string) => Promise<WebAssembly.Instance>) {}

  private cache: Map<string, WebAssembly.Instance> = new Map()

  async run(moduleSrc: string, functionName: string, args: unknown[]): Promise<unknown> {
    let instance
    if (this.cache.has(moduleSrc)) instance = this.cache.get(moduleSrc) as WebAssembly.Instance
    else {
      instance = await this.createInstance(moduleSrc)
      this.cache.set(moduleSrc, instance)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const fn = Reflect.get(instance.exports, functionName) as Function
    if (!fn) throw new ConcurrencyError(ErrorMessage.UnexportedFunction, functionName, moduleSrc)

    const result = Reflect.apply(fn, instance.exports, args)
    return result
  }
}

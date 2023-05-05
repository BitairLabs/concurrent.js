import { ErrorMessage } from '../constants.js'
import { ConcurrencyError } from '../error.js'

import type { ExternLibProxy, ExternLibExports, IInteropHandler } from '../types.js'

export class ExternInteropHandler implements IInteropHandler {
  constructor(private link: (moduleSrc: string, functions: ExternLibExports) => ExternLibProxy) {}

  private cache: Map<string, ExternLibProxy> = new Map()

  async run(moduleSrc: string, functionName: string, args: unknown[]): Promise<unknown> {
    const [fnArgs, fnSigs] = args as [unknown[], ExternLibExports]

    let lib: ExternLibProxy
    if (this.cache.has(moduleSrc)) lib = this.cache.get(moduleSrc) as ExternLibProxy
    else {
      lib = this.link(moduleSrc, fnSigs)
      this.cache.set(moduleSrc, lib)
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const fn = lib[functionName] as Function
    if (!fn) throw new ConcurrencyError(ErrorMessage.UnexportedFunction, functionName, moduleSrc)
    const result = fn(...fnArgs)
    return Promise.resolve(result)
  }
}

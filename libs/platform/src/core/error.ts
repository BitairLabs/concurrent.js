import { format } from './utils.js'

export class ConcurrencyError extends Error {
  code: number
  constructor({ code, text }: { code: number; text: string }, ...params: unknown[]) {
    super(format(`Concurrent.js Error: ${text}`, ...params))
    this.code = code
  }
}

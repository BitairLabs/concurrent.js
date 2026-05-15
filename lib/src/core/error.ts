import type { IConcurrencyError } from './types.js'
import { format } from './utils.js'

export class ConcurrencyError extends Error implements IConcurrencyError {
  code: number
  constructor({ code, text }: { code: number; text: string }, ...params: unknown[]) {
    const message = format(`Concurrent.js Error: ${text}`, params)
    super(message)
    this.code = code
  }
}

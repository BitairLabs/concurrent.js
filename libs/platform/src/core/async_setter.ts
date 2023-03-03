import type { IAsyncSetter } from '../index.js'

export class AsyncSetter implements IAsyncSetter {
  private constructor(public value: unknown) {}

  static create<T>(value: T): T {
    return new AsyncSetter(value) as T
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  done(_error?: Error): void {
    throw new Error('Callback is accessed before being initialized.')
  }

  wait(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.done = (error?: Error) => {
        if (error) reject(error)
        else resolve()
      }
    })
  }
}

import type { DoneCallBack } from './types.js'

export class Coroutine {
  private static lastCoroutineId = 0

  constructor(public id: number, private callback: DoneCallBack) {}

  static create(callback: DoneCallBack): Coroutine {
    this.lastCoroutineId += 1

    return new Coroutine(this.lastCoroutineId, callback)
  }

  done(error: Error | undefined, result: unknown | undefined) {
    this.callback(error, result)
  }
}

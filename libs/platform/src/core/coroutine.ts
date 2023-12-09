import type { DoneCallBack, IChannel } from './types.js'

export class Coroutine {
  private static lastCoroutineId = 0

  constructor(public id: number, private callback: DoneCallBack, public channel?: IChannel) {}

  static create(callback: DoneCallBack, channel?: IChannel | undefined): Coroutine {
    this.lastCoroutineId += 1

    return new Coroutine(this.lastCoroutineId, callback, channel)
  }

  done(error: Error | undefined, result: unknown | undefined) {
    this.callback(error, result)
  }
}

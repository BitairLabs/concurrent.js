import type { CallBack } from './types.js'

export class Message {
  private static lastMessageId = 0

  constructor(public id: number, private replyCallback: CallBack) {}

  static create(replyCallback: CallBack): Message {
    this.lastMessageId += 1

    return new Message(this.lastMessageId, replyCallback)
  }

  reply(error: Error | undefined, result: unknown | undefined) {
    this.replyCallback(error, result)
  }
}

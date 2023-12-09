import { ThreadMessageType, ErrorMessage } from './constants.js'
import { ConcurrencyError } from './error.js'
import { Message } from './message.js'

import type { IWorker, MessageReply, CoroutineMessage, ThreadMessage, IChannel } from './types.js'

export class Channel implements IChannel {
  worker?: { postMessage: IWorker['postMessage'] }
  coroutineId?: number
  messages: Map<number, Message>
  messageHandler?: (name: string | number, ...data: unknown[]) => void
  initialized = false

  constructor(listener: (onmessage: Channel['onmessage'], postMessage: Channel['postMessage']) => void) {
    this.messages = new Map()
    listener(this.onmessage.bind(this), this.postMessage.bind(this))
  }

  init(worker: { postMessage: IWorker['postMessage'] }, coroutineId: number) {
    this.initialized = true
    this.worker = worker
    this.coroutineId = coroutineId
  }

  onmessage(handler: (name: string | number, ...data: unknown[]) => Promise<unknown>): void {
    this.messageHandler = handler
  }

  postMessage(name: string | number, ...data: unknown[]) {
    return new Promise((resolve, reject) => {
      const message = Message.create((error, result) => {
        if (error) return reject(error)
        return resolve(result)
      })
      this.messages.set(message.id, message)
      this.worker?.postMessage([
        ThreadMessageType.DirectMessage,
        [this.coroutineId, [message.id, name, data]] as CoroutineMessage
      ] as ThreadMessage)
    })
  }

  async handleMessage(name: string | number, data: unknown[]) {
    if (this.messageHandler) return await this.messageHandler(name, ...data)
  }

  async handleMessageReply([messageId, error, result]: MessageReply) {
    const message = this.messages.get(messageId)
    if (!message) throw new ConcurrencyError(ErrorMessage.MessageNotFound, messageId)
    await message.reply(error, result)
    this.messages.delete(messageId)
  }
}

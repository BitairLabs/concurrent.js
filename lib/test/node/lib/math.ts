import { isMainThread } from 'node:worker_threads'
import type { IChannel } from '../../../src/index.js'

export function isWorker() {
  return !isMainThread
}

export function isPrime(n: number) {
  const j = Math.sqrt(n)
  for (let i = 2; i <= j; i++) {
    if (n % i === 0) return false
  }
  return n > 1
}

export function divide(x: number, y: number) {
  if (!y) throw new Error('Division by zero')

  return x / y
}

export async function reactiveAdd(channel: IChannel) {
  let done = false
  let sum = 0

  channel.onmessage(name => {
    if (name === 'done') {
      done = true
      return sum
    }

    return undefined
  })

  let i = 0
  do {
    sum += (await channel.postMessage('next', i++)) as number
  } while (!done)

  return sum
}

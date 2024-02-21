import { expect, test } from 'bun:test'
import { concurrent, Channel } from '../../src/node/index.js'
import type { IChannel } from '../../src/index.d.ts'

const SERVICES_SRC = new URL('./sample_services/index.ts', import.meta.url)
const THREAD_INSTANTIATION_DELAY = 0.5
const MAX_THREADS = 4

const services = await concurrent.import(SERVICES_SRC).load()

concurrent.config({
  maxThreads: MAX_THREADS
})

test('should invoke an exported function', async () => {
  expect(await services.isWorker()).toEqual(true)
  expect(await services.isPrime(3)).toEqual(true)
  expect(await services.isPrime(4)).toEqual(false)
})

test('should run multiple functions in parallel', async () => {
  expect(await services.isWorker()).toEqual(true)
  const ops: Promise<boolean>[] = []
  for (let i = 0; i < MAX_THREADS * 20; i++) {
    const services = await concurrent.import(SERVICES_SRC).load()

    ops.push(Promise.resolve(services.isPrime(i)))
  }

  const startTime = Date.now()
  await Promise.all(ops)
  const endTime = Date.now()

  expect((endTime - startTime) / 1000).toBeLessThanOrEqual(ops.length + MAX_THREADS * THREAD_INSTANTIATION_DELAY)
})

test.only('should be disabled when the disabled flag is on', async () => {
  concurrent.config({ disabled: true })

  const services = await concurrent.import(SERVICES_SRC).load()
  expect(await services.isWorker()).toEqual(false)

  concurrent.config({ disabled: false })
})

test('should run a reactive function', async () => {
  const arr = [1, 2, 3, 4]

  const reactiveAddChannel = new Channel((onmessage: IChannel['onmessage'], postMessage: IChannel['postMessage']) => {
    onmessage(async (name, ...data) => {
      if (name === 'next') {
        const [i] = data as [number]
        expect(i).toBeLessThanOrEqual(3)
        if (i === arr.length - 1) {
          const sum = (await postMessage('done')) as number
          expect(sum).toEqual(6)
        }
        return arr[i]
      }

      return undefined
    })
  })

  const result = await services.reactiveAdd(reactiveAddChannel)
  expect(result === 10)
})

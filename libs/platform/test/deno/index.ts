import { assert } from 'https://deno.land/std@0.181.0/testing/asserts.ts'
import { concurrent, Channel } from '../../build/deno/index.js'
import type { IChannel } from '../../src/index.d.ts'

const SERVICES_SRC = new URL('./sample_services/index.ts', import.meta.url)
const THREAD_INSTANTIATION_DELAY = 0.5
const MAX_THREADS = 4

const services = await concurrent.import(SERVICES_SRC).load()

concurrent.config({
  maxThreads: MAX_THREADS
})

Deno.test('should invoke an exported function', async () => {
  assert((await services.isWorker()) === true)
  assert((await services.isPrime(3)) === true)
  assert((await services.isPrime(4)) === false)
})

Deno.test({
  name: 'should run multiple functions in parallel',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    assert((await services.isWorker()) === true)
    const ops: Promise<boolean>[] = []
    for (let i = 0; i < MAX_THREADS * 20; i++) {
      const services = await concurrent.import(SERVICES_SRC).load()

      ops.push(Promise.resolve(services.isPrime(i)))
    }

    const startTime = Date.now()
    await Promise.all(ops)
    const endTime = Date.now()

    assert((endTime - startTime) / 1000 <= ops.length + MAX_THREADS * THREAD_INSTANTIATION_DELAY)
  }
})

Deno.test('should be disabled when the disabled flag is on', async () => {
  concurrent.config({ disabled: true })

  const services = await concurrent.import(SERVICES_SRC).load()
  assert((await services.isWorker()) == false)

  concurrent.config({ disabled: false })
})

Deno.test('should run a reactive function', async () => {
  const arr = [1, 2, 3, 4]

  const reactiveAddChannel = new Channel((onmessage: IChannel['onmessage'], postMessage: IChannel['postMessage']) => {
    onmessage(async (name, ...data) => {
      if (name === 'next') {
        const [i] = data as [number]
        assert(i <= 3)
        if (i === arr.length - 1) {
          const sum = (await postMessage('done')) as number
          assert(sum === 6)
        }
        return arr[i]
      }

      return undefined
    })
  })

  const result = await services.reactiveAdd(reactiveAddChannel)
  assert(result === 10)
})

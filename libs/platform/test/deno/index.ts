import { assert } from 'https://deno.land/std@0.181.0/testing/asserts.ts'
import { concurrent } from '../../build/deno/index.js'

const SERVICES_SRC = new URL('./sample_services/index.ts', import.meta.url)
const WASM_SERVICES_SRC = new URL('../../../../apps/sample/wasm/build/index.wasm', import.meta.url)
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

Deno.test({
  name: 'should run an exported wasm function',
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const services = await concurrent.import(WASM_SERVICES_SRC).load()
    const result = await services.add(1, 2)
    assert(result === 3)
  }
})

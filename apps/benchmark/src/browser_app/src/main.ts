import { concurrent } from '@bitair/concurrent.js'

import type * as Services from './services/index.js'

const MAX_THREADS = 10
const VALUE = 50_000n

concurrent.config({
  maxThreads: MAX_THREADS
})

const start = performance.now()

const tasks = []
for (let i = 0; i < MAX_THREADS; i++) {
  const { factorial } = await concurrent.import<typeof Services>(new URL('./services/index.js', import.meta.url)).load()
  tasks.push(factorial(VALUE))
}
await Promise.all(tasks)

const end = performance.now()

const duration = Math.trunc(end - start) / 1000
console.log('__DONE__', duration)

await concurrent.terminate()

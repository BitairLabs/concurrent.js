import { concurrent } from '@bitair/concurrent.js'

const MAX_THREADS = 10
const VALUE = 50_000n

concurrent.config({
  maxThreads: MAX_THREADS
})

const progress = setInterval(() => process.stdout.write('■'), 1000)
const start = performance.now()

const tasks = []
for (let i = 0; i < MAX_THREADS; i++) {
  const { factorial } = await concurrent.import('extra-bigint').load()
  tasks.push(factorial(VALUE))
}
await Promise.all(tasks)

const end = performance.now()
clearInterval(progress)

const duration = Math.trunc(end - start) / 1000
console.log('%ss', duration)

await concurrent.terminate()

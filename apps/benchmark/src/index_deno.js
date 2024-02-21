import { concurrent } from 'https://deno.land/x/concurrentjs@v0.8.2/mod.ts'

const MAX_THREADS = 10
const VALUE = 50_000n

concurrent.config({
  maxThreads: MAX_THREADS
})

const progress = setInterval(() => Deno.writeAllSync(Deno.stdout, new TextEncoder().encode('■')), 1000)
const start = performance.now()

const tasks = []
for (let i = 0; i < MAX_THREADS; i++) {
  const { factorial } = await concurrent.import(new URL('./service_deno.js', import.meta.url)).load()
  tasks.push(factorial(VALUE))
}
await Promise.all(tasks)

const end = performance.now()
clearInterval(progress)

const duration = Math.trunc(end - start) / 1000
console.log('%ss', duration)

await concurrent.terminate()

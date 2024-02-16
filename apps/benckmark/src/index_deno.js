import { concurrent } from 'https://deno.land/x/concurrentjs@v0.8.2/mod.ts'

// Import it as usual to see the difference.
// import { factorial } from 'extra-bigint'

console.time('Execution Time')

const { factorial } = await concurrent.import(new URL('./service_deno.js', import.meta.url)).load()

// This would indicate whether the main process is blocked or not while calculating the n factorial.
const progress = setInterval(() => Deno.writeAllSync(Deno.stdout, new TextEncoder().encode('⯀')), 100)

const n = 50_000n
const result = await factorial(n)
console.log('\nThere are %d digits in 50000 factorial.', BigInt(result).toString().length)

clearInterval(progress)

await concurrent.terminate()

console.timeEnd('Execution Time')

import { concurrent } from '../../../../dist/mod.ts'

const { factorial } = await concurrent.load(new URL('./services/index.ts', import.meta.url))

const progress = setInterval(() => console.log('⯀'), 100)

const n = 50_000n
const result = await factorial(n)
console.log('\nThere are %d digits in %d factorial.', BigInt(result).toString().length, n.toString())

clearInterval(progress)

await concurrent.terminate()

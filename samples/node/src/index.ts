import { concurrent } from '@bitair/concurrent.js'

import type * as MathModule from './lib/math.js'

const MATH_MODULE_SRC = './lib/math.js'

const { factorial } = await concurrent.import<typeof MathModule>(new URL(MATH_MODULE_SRC, import.meta.url)).load()

// Create an interval to show that the main thread remains responsive
const progress = setInterval(() => process.stdout.write('⯀'), 100)

const n = 50_000n

console.log(`\nNon-Blocking Computation of Factorial(%s):`, n.toLocaleString())

const result = await factorial(n)

console.log('\nThe result contains %s digits.', BigInt(result).toString().length.toLocaleString())

clearInterval(progress)

await concurrent.terminate()

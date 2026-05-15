import assert from 'node:assert'
import { describe, after, it } from 'node:test'

import { concurrent } from '@bitair/concurrent.js'

import type * as MathModule from '../src/lib/math.js'

const MATH_MODULE_SRC = '../src/lib/math.js'

const { isPrime } = await concurrent.import<typeof MathModule>(new URL(MATH_MODULE_SRC, import.meta.url)).load()

describe('Testing Node Sample', () => {
  after(async () => {
    await concurrent.terminate()
  })

  it('should invoke an exported function', async () => {
    const result = await isPrime(5n)
    assert.strictEqual(result, true)
  })
})

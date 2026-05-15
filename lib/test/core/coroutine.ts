import assert from 'node:assert'
import { describe, it } from 'node:test'

import { Coroutine } from '../../src/core/coroutine.js'
import { getLastCoroutineId } from './common/helpers.js'

describe('Testing Coroutine', () => {
  it('creates coroutines', () => {
    const lastCoroutineId = getLastCoroutineId()
    for (let i = 1; i <= 10; i++) {
      const coroutine = Coroutine.create(() => {})
      assert.strictEqual(coroutine.id, i + lastCoroutineId)
    }
  })

  it('invokes the callback when a coroutine is done', (_t, done) => {
    const coroutine = Coroutine.create((error, result) => {
      assert.strictEqual(error, undefined)
      assert.notStrictEqual(result, undefined)
      done()
    })
    coroutine.done(undefined, true)
  })

  it('invokes the callback when a coroutine is done by an error', (_t, done) => {
    const coroutine = Coroutine.create((error, result) => {
      assert.strictEqual(error instanceof Error, true)
      assert.strictEqual(result, undefined)
      done()
    })
    coroutine.done(new Error(), undefined)
  })
})

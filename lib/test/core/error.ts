import assert from 'node:assert'
import { describe, it } from 'node:test'

import { ConcurrencyError } from '../../src/core/error.js'

describe('Testing ConcurrencyError', () => {
  it('creates an error', () => {
    const error = new ConcurrencyError(
      {
        code: 501,
        text: 'An error occurred when calling %{0}(%{1}, %{2}).'
      },
      'add',
      1,
      2
    )

    assert.strictEqual(error instanceof Error, true)
    assert.strictEqual(error.code, 501)
    assert.strictEqual(error.message, `Concurrent.js Error: An error occurred when calling add(1, 2).`)
  })
})

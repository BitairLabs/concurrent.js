import { expect } from 'chai'

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

    expect(error).instanceOf(Error)
    expect(error.code).equal(501)
    expect(error.message).equal(`Concurrent.js Error: An error occurred when calling add(1, 2).`)
  })
})

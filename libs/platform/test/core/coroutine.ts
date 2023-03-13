import { expect } from 'chai'

import { Coroutine } from '../../src/core/coroutine.js'

describe('Testing Coroutine', () => {
  it('creates coroutines', () => {
    for (let i = 0; i < 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const coroutine = Coroutine.create(() => {})
      expect(coroutine.id).equal(i + 1)
    }
  })

  it('invokes the callback when a coroutine is done', done => {
    const coroutine = Coroutine.create((error, result) => {
      expect(error).undefined
      expect(result).not.undefined
      done()
    })
    coroutine.done(undefined, true)
  })

  it('invokes the callback when a coroutine is done by an error', done => {
    const coroutine = Coroutine.create((error, result) => {
      expect(error).instanceOf(Error)
      expect(result).undefined
      done()
    })
    coroutine.done(new Error(), undefined)
  })
})

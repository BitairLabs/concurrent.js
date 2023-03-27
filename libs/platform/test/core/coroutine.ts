import { expect } from 'chai'

import { Coroutine } from '../../src/core/coroutine.js'
import { getLastCoroutineId } from './common/helpers.js'

describe('Testing Coroutine', () => {
  it('creates coroutines', () => {
    const lastCoroutineId = getLastCoroutineId()
    for (let i = 1; i <= 10; i++) {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const coroutine = Coroutine.create(() => {})
      expect(coroutine.id).equal(i + lastCoroutineId)
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

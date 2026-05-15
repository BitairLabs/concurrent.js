import assert from 'node:assert'
import { describe, beforeEach, afterEach, it } from 'node:test'

import { defaultThreadPoolSettings } from '../../src/core/constants.js'
import { Constants } from '../../src/core/index.js'
import { createThreadPool, getThreadPoolSettings, getThreadPoolThreads } from './common/helpers.js'

import type { ThreadPoolSettings } from '../../src/index.js'
import type { ConcurrencyError } from '../../src/core/error.js'
import type { ThreadPool } from '../../src/core/thread_pool.js'

let pool: ThreadPool

describe('Testing ThreadPool', () => {
  beforeEach(() => {
    pool = createThreadPool()
  })

  afterEach(async () => {
    await pool.terminate()
  })

  it('creates a thread pool', () => {
    assert.strictEqual(getThreadPoolThreads(pool).length, defaultThreadPoolSettings.minThreads)
  })

  it('updates settings', () => {
    assert.deepStrictEqual(getThreadPoolSettings(pool), defaultThreadPoolSettings)

    const settings: ThreadPoolSettings = {
      maxThreads: 2,
      minThreads: 1,
      threadIdleTimeout: 50
    }
    pool.config(settings)

    assert.deepStrictEqual(getThreadPoolSettings(pool), settings)
  })

  it('allocates the threads in a round-robin fashion', async () => {
    pool.config({ maxThreads: 2 })

    const thread1 = await pool.getThread()
    const thread2 = await pool.getThread()
    const thread3 = await pool.getThread()
    const thread4 = await pool.getThread()
    const thread5 = await pool.getThread()

    assert.notStrictEqual(thread1, thread2)
    assert.strictEqual(thread3, thread1)
    assert.strictEqual(thread4, thread2)
    assert.strictEqual(thread5, thread1)
  })

  it('terminates', async () => {
    pool.config({ maxThreads: 2 })
    await pool.getThread()
    await pool.getThread()

    assert.strictEqual(getThreadPoolThreads(pool).length, 2)
    await pool.terminate()
    assert.strictEqual(getThreadPoolThreads(pool).length, 0)

    let error
    try {
      await pool.getThread()
    } catch (_error) {
      error = _error
    }
    assert.strictEqual((error as ConcurrencyError).code, Constants.ErrorMessage.ThreadPoolTerminated.code)
  })
})

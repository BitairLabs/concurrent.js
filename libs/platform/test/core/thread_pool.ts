import { expect } from 'chai'

import { defaultThreadPoolSettings } from '../../src/core/constants.js'
import { createThreadPool, getThreadPoolSettings, getThreadPoolThreads } from './common/helpers.js'

import type { ThreadPoolSettings } from '../../src/index.js'
import type { ConcurrencyError } from '../../src/core/error.js'
import { Constants } from '../../src/core/index.js'
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
    expect(getThreadPoolThreads(pool).length).equal(defaultThreadPoolSettings.minThreads)
  })

  it('updates settings', () => {
    expect(getThreadPoolSettings(pool)).deep.equal(defaultThreadPoolSettings)

    const settings: ThreadPoolSettings = {
      maxThreads: 2,
      minThreads: 1,
      threadIdleTimeout: 50
    }
    pool.config(settings)

    expect(getThreadPoolSettings(pool)).deep.equal(settings)
  })

  it('allocates the threads in a round-robin fashion', async () => {
    pool.config({ maxThreads: 2 })

    const thread1 = await pool.getThread()
    const thread2 = await pool.getThread()
    const thread3 = await pool.getThread()
    const thread4 = await pool.getThread()
    const thread5 = await pool.getThread()

    expect(thread1 !== thread2).true
    expect(thread3 === thread1).true
    expect(thread4 === thread2).true
    expect(thread5 === thread1).true
  })

  it('terminates', async () => {
    pool.config({ maxThreads: 2 })
    await pool.getThread()
    await pool.getThread()

    expect(getThreadPoolThreads(pool).length).equal(2)
    await pool.terminate()
    expect(getThreadPoolThreads(pool).length).equal(0)

    let error
    try {
      await pool.getThread()
    } catch (_error) {
      error = _error
    }
    expect((error as ConcurrencyError).code).equal(Constants.ErrorMessage.ThreadPoolTerminated.code)
  })
})

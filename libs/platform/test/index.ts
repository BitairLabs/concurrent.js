import { assert, expect } from 'chai'
import { cpus } from 'node:os'
import type { ConcurrencyError } from '../src/core/error.js'
import { Constants } from '../src/core/index.js'

import { AsyncSetter, concurrent } from '../src/node/index.js'

import type * as Services from './sample_services/index.js'

const THREAD_INSTANTIATION_DELAY = 0.5
const NOT_RUNNING_ON_WORKER = 'Nor running on a worker'
const SERVICES_SRC = new URL('../build/services/index.js', import.meta.url)
const { SampleObject, math } = await concurrent.load<typeof Services>(SERVICES_SRC)

concurrent.config({
  maxThreads: cpus().length
})

describe('Testing Master', () => {
  before(() => {
    process.env['BASE_URL'] = new URL('../build/', import.meta.url).href
  })

  after(async () => {
    await concurrent.terminate()
  })

  it('should instantiate an object', async () => {
    const obj = new SampleObject()
    const isWorker = await obj.isWorker
    expect(isWorker).to.be.true
    await concurrent.dispose(obj)
  })

  it('should instantiate an object with args', async () => {
    const obj = new SampleObject([1])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    const result = await obj._data
    expect(result).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an instance getter', async () => {
    const obj = new SampleObject([1])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    const result = await obj.data
    expect(result).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an instance setter', async () => {
    const obj = new SampleObject([1])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    await concurrent.set((obj.data = AsyncSetter([1, 2])))
    const result = await obj.data
    expect(result).to.be.deep.equal([1, 2])
    await concurrent.dispose(obj)
  })

  it('should access an instance method', async () => {
    const obj = new SampleObject([1])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    await obj.setData([1, 2])
    const result = await obj.getData()
    expect(result).to.be.deep.equal([1, 2])
    await concurrent.dispose(obj)
  })

  it('should access an async instance method', async () => {
    const obj = new SampleObject([1])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    const result = await obj.echoAsync('hello world')
    expect(result).to.be.deep.equal('hello world')
    await concurrent.dispose(obj)
  })

  it('should access an external module', async () => {
    const obj = new SampleObject()
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    const result = await obj.format('%s %s', 'hello', 'world')
    expect(result).to.be.equal('hello world')
    await concurrent.dispose(obj)
  })

  it('should access a local module', async () => {
    const obj = new SampleObject()
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    let result = await obj.isPrime(3)
    expect(result).to.be.equal(true)
    result = await obj.isPrime(4)
    expect(result).to.be.equal(false)
    await concurrent.dispose(obj)
  })

  it('should invoke an exported function', async () => {
    const result = await math.isPrime(3)
    expect(result).to.be.equal(true)
  })

  it('should run multiple instance methods in parallel', async () => {
    const { SampleObject } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    const ops: Promise<boolean>[] = []
    for (let i = 0; i < cpus().length * 20; i++) {
      const obj = new SampleObject()
      assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
      ops.push(
        Promise.resolve(obj.isPrime(i)).then(async result => {
          await concurrent.dispose(obj)
          return result
        })
      )
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    expect((endTime - startTime) / 1000).to.be.lessThan(ops.length + cpus().length * THREAD_INSTANTIATION_DELAY)
  })

  it('should run multiple functions in parallel', async () => {
    const { math } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    const ops: Promise<boolean>[] = []
    for (let i = 0; i < cpus().length * 20; i++) {
      ops.push(Promise.resolve(math.isPrime(i)))
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    expect((endTime - startTime) / 1000).to.be.lessThan(ops.length + cpus().length * THREAD_INSTANTIATION_DELAY)
  })

  it('should bubble up an unhandled exception', async () => {
    try {
      await math.divide(1, 0)
    } catch (error) {
      expect((error as Error).message).to.be.equal('Division by zero')
    }
  })

  it('should explicitly deconstruct an instance', async () => {
    const obj = new SampleObject()
    await concurrent.dispose(obj)
    try {
      await obj.isPrime(5)
    } catch (error) {
      expect((error as ConcurrencyError).code).to.be.equal(Constants.ErrorMessage.ObjectNotFound).true
    }
  })

  it('should implicitly deconstruct an instance', async () => {
    const { SampleObject } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    const results: boolean[] = []
    for (let i = 0; i < cpus().length; i++) {
      const obj = new SampleObject()
      const result = await obj.isPrime(i)
      results.push(result)
    }

    const obj = new SampleObject()
    const result = await obj.isPrime(4)
    results.push(result)

    expect(results.length).to.deep.equal(cpus().length + 1)
  })

  it('should throw thread allocation timeout', async () => {
    const { SampleObject } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    concurrent.config({
      threadAllocationTimeout: 0.001
    })

    let obj
    try {
      obj = new SampleObject()
      await obj.isPrime(5)
    } catch (error) {
      concurrent.dispose(obj)
      expect((error as ConcurrencyError).code).to.be.equal(Constants.ErrorMessage.ThreadAllocationTimeout.code)
    }

    concurrent.config({
      threadAllocationTimeout: Infinity
    })
  })

  it('should be disabled when the disabled flag is on', async () => {
    concurrent.config({
      disabled: true
    })
    const { SampleObject } = await concurrent.load<typeof Services>(SERVICES_SRC)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = new SampleObject()
    expect(obj.isWorker).to.be.false
    await concurrent.dispose(obj)
    concurrent.config({
      disabled: false
    })
  })
})

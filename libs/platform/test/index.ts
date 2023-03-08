import { assert, expect } from 'chai'
import { cpus } from 'node:os'
import { ErrorMessage } from '../src/core/constants.js'
import type { ConcurrencyError } from '../src/core/error.js'
import { Constants } from '../src/core/index.js'

import { concurrent } from '../src/node/index.js'

import type * as Services from './sample_services/index.js'

const THREAD_INSTANTIATION_DELAY = 0.5
const NOT_RUNNING_ON_WORKER = 'Not running on a worker'
const SERVICES_SRC = new URL('../build/services/index.js', import.meta.url)
const { SampleObject, isWorker, isPrime, divide } = await concurrent.load<typeof Services>(SERVICES_SRC)

concurrent.config({
  maxThreads: 2
})

describe('Testing Master', () => {
  before(() => {
    process.env['BASE_URL'] = new URL('../build/', import.meta.url).href
  })

  after(async () => {
    await concurrent.terminate()
  })

  it('should throw an exception when loading a non-function type export', async () => {
    const { isWorker } = await concurrent.load<typeof Services>(SERVICES_SRC)
    expect(await isWorker()).to.be.true
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { Math } = await concurrent.load<typeof Services>(SERVICES_SRC)
      await Math.isPrime(3)
    } catch (error) {
      expect((error as ConcurrencyError).code).to.be.equal(ErrorMessage.NonFunctionLoad.code)
    }
  })

  it('should invoke an exported function', async () => {
    expect(await isWorker()).to.be.true
    expect(await isPrime(3)).to.be.equal(true)
  })

  it('should instantiate an exported class', async () => {
    const obj = await new SampleObject()
    const isWorker = obj.isWorker
    expect(await isWorker).to.be.true
    await concurrent.dispose(obj)
  })

  it('should instantiate an exported class with args', async () => {
    const obj = await new SampleObject([1])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj._data).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an instance field', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj._data).to.be.deep.equal([])
    await ((obj._data = [1]), obj._data)
    expect(await obj._data).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an instance getter/setter', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj.data).to.be.deep.equal([])
    await ((obj.data = [1]), obj.data)
    expect(await obj.data).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an instance method', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj.getData()).to.be.deep.equal([])
    await obj.setData([1])
    expect(await obj.getData()).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an inherited field', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj._baseData).to.be.deep.equal([])
    await ((obj._baseData = [1]), obj._baseData)
    expect(await obj._baseData).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an inherited getter/setter', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj.baseData).to.be.deep.equal([])
    await ((obj.baseData = [1]), obj.baseData)
    expect(await obj.baseData).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an inherited method', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj.getBaseData()).to.be.deep.equal([])
    await obj.setBaseData([1])
    expect(await obj.getBaseData()).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access a static field', async () => {
    const obj = SampleObject
    assert(await obj.staticIsWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj._staticData).to.be.deep.equal(undefined)
    await ((obj._staticData = [1]), obj._staticData)
    expect(await obj._staticData).to.be.deep.equal([1])
  })

  it('should access a static getter/setter', async () => {
    const obj = SampleObject
    assert(await obj.staticIsWorker, NOT_RUNNING_ON_WORKER)
    await ((obj._staticData = [1]), obj._staticData)
    expect(await obj.staticData).to.be.deep.equal([1])
    await ((obj.staticData = [2]), obj.staticData)
    expect(await obj.staticData).to.be.deep.equal([2])
  })

  it('should access a static method', async () => {
    const obj = SampleObject
    assert(await obj.staticIsWorker, NOT_RUNNING_ON_WORKER)
    await ((obj._staticData = [1]), obj._staticData)
    expect(await obj.getStaticData()).to.be.deep.equal([1])
    await obj.setStaticData([2])
    expect(await obj.getStaticData()).to.be.deep.equal([2])
  })

  it('should access an async method', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj.getDataAsync()).to.be.deep.equal([])
    await obj.setDataAsync([1])
    expect(await obj.getDataAsync()).to.be.deep.equal([1])
    await concurrent.dispose(obj)
  })

  it('should access an overridden method', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    await obj.setBaseData([1])
    expect(await obj.getBaseData()).to.be.deep.equal([1])
    expect(await obj.overridableGetBaseData()).to.be.deep.equal([])
    await concurrent.dispose(obj)
  })

  it('should throw an exception when assigning a method', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    try {
      await ((obj.setData = () => undefined), obj.setData)
    } catch (error) {
      expect((error as ConcurrencyError).code).to.be.equal(ErrorMessage.MethodAssignment.code)
    }
    await concurrent.dispose(obj)
  })

  it('should throw an exception when accessing an undefined method', async () => {
    const obj = await new SampleObject([])
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    try {
      expect(await Reflect.get(obj, 'getData2')()).to.be.deep.equal([])
    } catch (error) {
      expect((error as Error) instanceof TypeError).to.be.true
    }
    await concurrent.dispose(obj)
  })

  it('should access an external module', async () => {
    const obj = await new SampleObject()
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    const result = await obj.format('%s %s', 'hello', 'world')
    expect(result).to.be.equal('hello world')
    await concurrent.dispose(obj)
  })

  it('should access a local module', async () => {
    const obj = await new SampleObject()
    assert(await obj.isWorker, NOT_RUNNING_ON_WORKER)
    expect(await obj.isPrime(3)).to.be.equal(true)
    expect(await obj.isPrime(4)).to.be.equal(false)
    await concurrent.dispose(obj)
  })

  it('should run multiple instance methods in parallel', async () => {
    const { SampleObject } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    const ops: Promise<boolean>[] = []
    for (let i = 0; i < cpus().length * 20; i++) {
      const obj = await new SampleObject()
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
    const { isPrime } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    const ops: Promise<boolean>[] = []
    for (let i = 0; i < cpus().length * 20; i++) {
      ops.push(Promise.resolve(isPrime(i)))
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    expect((endTime - startTime) / 1000).to.be.lessThan(ops.length + cpus().length * THREAD_INSTANTIATION_DELAY)
  })

  it('should bubble up an unhandled exception', async () => {
    try {
      await divide(1, 0)
    } catch (error) {
      expect((error as Error).message).to.be.equal('Division by zero')
    }
  })

  it('should explicitly deconstruct an instance', async () => {
    const obj = await new SampleObject()
    await concurrent.dispose(obj)
    try {
      await obj.isPrime(5)
    } catch (error) {
      expect((error as ConcurrencyError).code).to.be.equal(Constants.ErrorMessage.ObjectNotFound.code)
    }
  })

  it('should implicitly deconstruct an instance', async () => {
    const { SampleObject } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    const results: boolean[] = []
    for (let i = 0; i < cpus().length; i++) {
      const obj = await new SampleObject()
      results.push(await obj.isPrime(i))
    }

    const obj = await new SampleObject()
    results.push(await obj.isPrime(4))

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
      obj = await new SampleObject()
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
    const { SampleObject, isWorker } = await concurrent.load<typeof Services>(SERVICES_SRC)
    const obj = await new SampleObject([1])
    expect(await obj.isWorker).to.be.false
    expect(await isWorker()).to.be.false
    concurrent.config({
      disabled: false
    })
  })
})

import assert from 'node:assert'
import os from 'node:os'
import { after, before, beforeEach, describe, it } from 'node:test'

import { Channel } from '../../src/core/channel.js'
import { ErrorMessage } from '../../src/core/constants.js'
import { getProperties } from '../../src/core/utils.js'
import { concurrent } from '../../src/node/index.js'

import * as LibModule from './lib/index.js'

import type { ConcurrencyError } from '../../src/core/error.js'

const MAX_THREADS = os.availableParallelism()
const THREAD_INSTANTIATION_DELAY = 0.5
const NOT_RUNNING_ON_WORKER = 'Not running on a worker'
const LIB_SRC = new URL('./lib/index.js', import.meta.url)

concurrent.config({
  maxThreads: MAX_THREADS
})

const lib = await concurrent.import<typeof LibModule>(LIB_SRC).load()

describe('Testing Node.js platform ', () => {
  before(async () => {
    process.env['BASE_URL'] = new URL('./', import.meta.url).href
  })

  after(async () => {
    await concurrent.terminate()
  })

  beforeEach(async () => {
    assert(await lib.isWorker, NOT_RUNNING_ON_WORKER)
  })

  it('should not alter static members', async () => {
    assert.deepStrictEqual(getProperties(lib.isPrime), getProperties(LibModule.isPrime))
    assert.deepStrictEqual(getProperties(lib.SampleObject), getProperties(LibModule.SampleObject))
  })

  it('should not alter instance members', async () => {
    const obj = await new lib.SampleObject()
    assert.strictEqual(await obj.isWorker, true)
    assert.deepStrictEqual(getProperties(obj), getProperties(new LibModule.SampleObject()))
  })

  it('should throw an exception when loading a non-function type export', async () => {
    let error
    try {
      await lib.Math.isPrime(3)
    } catch (_error) {
      error = _error
    }
    assert.strictEqual((error as ConcurrencyError).code, ErrorMessage.NotAccessibleExport.code)
  })

  it('should invoke an exported function', async () => {
    assert.strictEqual(await lib.isPrime(3), true)
    assert.strictEqual(await lib.isPrime(4), false)
  })

  it('should instantiate an exported class', async () => {
    const obj = await new lib.SampleObject()
    assert.strictEqual(await obj.isWorker, true)
  })

  it('should instantiate an exported class with args', async () => {
    const obj = await new lib.SampleObject([1])
    assert.deepStrictEqual(await obj._data, [1])
  })

  it('should access an instance field', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.deepStrictEqual(await obj._data, [])
    await ((obj._data = [1]), obj._data)
    assert.deepStrictEqual(await obj._data, [1])
  })

  it('should access an instance getter/setter', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.deepStrictEqual(await obj.data, [])
    await ((obj.data = [1]), obj.data)
    assert.deepStrictEqual(await obj.data, [1])
  })

  it('should access an instance method', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.deepStrictEqual(await obj.getData(), [])
    await obj.setData([1])
    assert.deepStrictEqual(await obj.getData(), [1])
  })

  it('should access an inherited field', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.deepStrictEqual(await obj._baseData, [])
    await ((obj._baseData = [1]), obj._baseData)
    assert.deepStrictEqual(await obj._baseData, [1])
  })

  it('should access an inherited getter/setter', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.deepStrictEqual(await obj.baseData, [])
    await ((obj.baseData = [1]), obj.baseData)
    assert.deepStrictEqual(await obj.baseData, [1])
  })

  it('should access an inherited method', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.deepStrictEqual(await obj.getBaseData(), [])
    await obj.setBaseData([1])
    assert.deepStrictEqual(await obj.getBaseData(), [1])
  })

  it('should access a static field', async () => {
    assert.deepStrictEqual(await lib.SampleObject._staticData, undefined)
    await ((lib.SampleObject._staticData = [1]), lib.SampleObject._staticData)
    assert.deepStrictEqual(await lib.SampleObject._staticData, [1])
  })

  it('should access a static getter/setter', async () => {
    await ((lib.SampleObject._staticData = [1]), lib.SampleObject._staticData)
    assert.deepStrictEqual(await lib.SampleObject.staticData, [1])
    await ((lib.SampleObject.staticData = [2]), lib.SampleObject.staticData)
    assert.deepStrictEqual(await lib.SampleObject.staticData, [2])
  })

  it('should access a static method', async () => {
    await ((lib.SampleObject._staticData = [1]), lib.SampleObject._staticData)
    assert.deepStrictEqual(await lib.SampleObject.getStaticData(), [1])
    await lib.SampleObject.setStaticData([2])
    assert.deepStrictEqual(await lib.SampleObject.getStaticData(), [2])
  })

  it('should access an async method', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.deepStrictEqual(await obj.getDataAsync(), [])
    await obj.setDataAsync([1])
    assert.deepStrictEqual(await obj.getDataAsync(), [1])
  })

  it('should access an overridden method', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    await obj.setBaseData([1])
    assert.deepStrictEqual(await obj.getBaseData(), [1])
    assert.deepStrictEqual(await obj.overridableGetBaseData(), [])
  })

  it('should throw an exception when assigning a method', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    let error
    try {
      await ((obj.setData = () => undefined), obj.setData)
    } catch (_error) {
      error = _error
    }
    assert.strictEqual((error as ConcurrencyError).code, ErrorMessage.MethodAssignment.code)
  })

  it('should throw an exception when accessing an undefined method', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    let error
    try {
      assert.deepStrictEqual(await Reflect.get(obj, 'getData2')(), [])
    } catch (_error) {
      error = _error
    }
    assert.strictEqual((error as Error) instanceof TypeError, true)
  })

  it('should access an external module', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    const result = await obj.format('%s %s', 'hello', 'world')
    assert.strictEqual(result, 'hello world')
  })

  it('should access a local module', async () => {
    const obj = await new lib.SampleObject([])
    assert.strictEqual(await obj.isWorker, true)

    assert.strictEqual(await obj.isPrime(3), true)
    assert.strictEqual(await obj.isPrime(4), false)
  })

  it('should run multiple functions in parallel', async () => {
    const ops: Promise<boolean>[] = []
    for (let i = 0; i < MAX_THREADS * 2; i++) {
      const lib = await concurrent.import<typeof LibModule>(LIB_SRC).load()

      ops.push(Promise.resolve(lib.isPrime(i)))
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    assert.strictEqual((endTime - startTime) / 1000 < ops.length + MAX_THREADS * THREAD_INSTANTIATION_DELAY, true)
  })

  it('should run multiple instance methods in parallel', async () => {
    const ops: Promise<boolean>[] = []
    for (let i = 0; i < MAX_THREADS * 20; i++) {
      const lib = await concurrent.import<typeof LibModule>(LIB_SRC).load()

      const obj = await new lib.SampleObject()
      assert.strictEqual(await obj.isWorker, true)

      ops.push(Promise.resolve(obj.isPrime(i)))
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    assert.strictEqual((endTime - startTime) / 1000 < ops.length + MAX_THREADS * THREAD_INSTANTIATION_DELAY, true)
  })

  it('should bubble up an unhandled exception', async () => {
    let error
    try {
      await lib.divide(1, 0)
    } catch (_error) {
      error = _error
    }
    assert.strictEqual((error as Error).message, 'Division by zero')
  })

  it('should be disabled when the disabled flag is on', async () => {
    concurrent.config({ disabled: true })

    const lib = await concurrent.import<typeof LibModule>(LIB_SRC).load()
    const obj = await new lib.SampleObject([1])

    assert.strictEqual(await obj.isWorker, false)
    assert.strictEqual(await lib.isWorker(), false)

    concurrent.config({ disabled: false })
  })

  it('should run a reactive function', async () => {
    const result = await lib.reactiveAdd(createReactiveAddChannel())
    assert.strictEqual(result, 10)
  })

  it('should run a reactive static method', async () => {
    const result = await lib.SampleObject.reactiveAdd(createReactiveAddChannel())
    assert.strictEqual(result, 10)
  })

  it('should run a reactive instance method', async () => {
    const obj = await new lib.SampleObject([])
    const result = await obj.reactiveAdd(createReactiveAddChannel())
    assert.strictEqual(result, 10)
  })
})

function createReactiveAddChannel() {
  const arr = [1, 2, 3, 4]

  return new Channel((onmessage, postMessage) => {
    onmessage(async (name, ...data) => {
      if (name === 'next') {
        const [i] = data as [number]
        assert.strictEqual(i <= 3, true)
        if (i === arr.length - 1) {
          const sum = (await postMessage('done')) as number
          assert.strictEqual(sum, 6)
        }
        return arr[i]
      }

      return undefined
    })
  })
}

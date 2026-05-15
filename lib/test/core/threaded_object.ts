import assert from 'node:assert'
import { describe, beforeEach, it } from 'node:test'

import sinon from 'sinon'

import { TaskType } from '../../src/core/constants.js'
import { ThreadedObject } from '../../src/core/threaded_object.js'
import { createThread } from './common/helpers.js'

import type { Thread } from '../../src/core/thread.js'
import type {
  DisposeObjectData,
  GetInstancePropertyData,
  InvokeInstanceMethodData,
  SetInstancePropertyData
} from '../../src/core/types.js'

const MODULE_SRC = 'sample_module_src'
const EXPORT_NAME = 'SampleObject'
const OBJECT_ID = 1

let thread: Thread
let threadedObject: ThreadedObject

describe('Testing ThreadedObject', () => {
  beforeEach(async () => {
    thread = createThread()
    thread.run = task => {
      if (task.type === TaskType.InstantiateObject) return Promise.resolve([OBJECT_ID])
      return Promise.resolve(undefined)
    }
    threadedObject = await ThreadedObject.create(thread, MODULE_SRC, EXPORT_NAME, [])
  })

  it('creates a threaded object', async () => {
    assert.strictEqual(threadedObject instanceof ThreadedObject, true)
  })

  it('gets an instance property', async () => {
    const PROP_NAME = 'sampleProp'
    const RESULT = 1

    sinon.stub(thread, 'run').callsFake(task => {
      assert.strictEqual(task.type, TaskType.GetInstanceProperty)
      assert.deepStrictEqual(task.data, [OBJECT_ID, PROP_NAME] as GetInstancePropertyData)
      return Promise.resolve(RESULT)
    })

    assert.strictEqual(await threadedObject.getProperty(PROP_NAME), RESULT)
  })

  it('sets an instance property', async () => {
    const PROP_NAME = 'sampleProp'
    const VALUE = 1

    sinon.stub(thread, 'run').callsFake(task => {
      assert.strictEqual(task.type, TaskType.SetInstanceProperty)
      assert.deepStrictEqual(task.data, [OBJECT_ID, PROP_NAME, VALUE] as SetInstancePropertyData)
      return Promise.resolve(undefined)
    })

    assert.strictEqual(await threadedObject.setProperty(PROP_NAME, VALUE), undefined)
  })

  it('invokes an instance method', async () => {
    const METHOD_NAME = 'sampleMethod'
    const ARGS = [1, 2]
    const RESULT = Math.max(...ARGS)

    sinon.stub(thread, 'run').callsFake(task => {
      assert.strictEqual(task.type, TaskType.InvokeInstanceMethod)
      assert.deepStrictEqual(task.data, [OBJECT_ID, METHOD_NAME, ARGS] as InvokeInstanceMethodData)
      return Promise.resolve(RESULT)
    })

    assert.strictEqual(await threadedObject.invoke(METHOD_NAME, ARGS), RESULT)
  })

  it('automatically disposes a threaded object', (_t, done) => {
    const OBJECT_ID = 2
    const thread = createThread()
    let disposed = false

    const createThreadedObject = async () => {
      thread.run = task => {
        if (task.type === TaskType.InstantiateObject) return Promise.resolve([OBJECT_ID])
        return Promise.resolve(undefined)
      }
      await ThreadedObject.create(thread, MODULE_SRC, EXPORT_NAME, [])
      sinon.stub(thread, 'run').callsFake(task => {
        if (task.type === TaskType.DisposeObject) {
          assert.strictEqual(task.type, TaskType.DisposeObject)
          assert.deepStrictEqual(task.data, [OBJECT_ID] as DisposeObjectData)
          disposed = true
        }
        return Promise.resolve(undefined)
      })
    }

    createThreadedObject().then(() => {
      const timer = setInterval(() => {
        if (disposed) {
          clearInterval(timer)
          done()
        }
      })
    })
  })
})

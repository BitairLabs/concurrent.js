import { expect } from 'chai'
import sinon from 'sinon'

import { TaskType } from '../../src/core/constants.js'
import { ThreadedObject } from '../../src/core/threaded_object.js'
import { createThread } from './common/helpers.js'

import type {
  DisposeObjectData,
  GetInstancePropertyData,
  InvokeInstanceMethodData,
  SetInstancePropertyData
} from '../../src/core/types.js'
import type { Thread } from '../../src/core/thread.js'

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
    expect(threadedObject).instanceOf(ThreadedObject)
  })

  it('gets an instance property', async () => {
    const PROP_NAME = 'sampleProp'
    const RESULT = 1

    sinon.stub(thread, 'run').callsFake(task => {
      expect(task.type).equal(TaskType.GetInstanceProperty)
      expect(task.data).deep.equal([OBJECT_ID, PROP_NAME] as GetInstancePropertyData)
      return Promise.resolve(RESULT)
    })

    expect(await threadedObject.getProperty(PROP_NAME)).equal(RESULT)
  })

  it('sets an instance property', async () => {
    const PROP_NAME = 'sampleProp'
    const VALUE = 1

    sinon.stub(thread, 'run').callsFake(task => {
      expect(task.type).equal(TaskType.SetInstanceProperty)
      expect(task.data).deep.equal([OBJECT_ID, PROP_NAME, VALUE] as SetInstancePropertyData)
      return Promise.resolve(undefined)
    })

    expect(await threadedObject.setProperty(PROP_NAME, VALUE)).equal(undefined)
  })

  it('invokes an instance method', async () => {
    const METHOD_NAME = 'sampleMethod'
    const ARGS = [1, 2]
    const RESULT = Math.max(...ARGS)

    sinon.stub(thread, 'run').callsFake(task => {
      expect(task.type).equal(TaskType.InvokeInstanceMethod)
      expect(task.data).deep.equal([OBJECT_ID, METHOD_NAME, ARGS] as InvokeInstanceMethodData)
      return Promise.resolve(RESULT)
    })

    expect(await threadedObject.invoke(METHOD_NAME, ARGS)).equal(RESULT)
  })

  it('automatically disposes a threaded object', done => {
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
          expect(task.type).equal(TaskType.DisposeObject)
          expect(task.data).deep.equal([OBJECT_ID] as DisposeObjectData)
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

import { expect } from 'chai'
import sinon from 'sinon'

import { TaskType } from '../../src/core/constants.js'
import { ThreadedFunction } from '../../src/core/threaded_function.js'
import { createThread } from './common/helpers.js'

import type {
  GetStaticPropertyData,
  InvokeFunctionData,
  InvokeStaticMethodData,
  SetStaticPropertyData
} from '../../src/core/types.js'
import type { Thread } from '../../src/core/thread.js'

const MODULE_SRC = 'sample_module_src'
const EXPORT_NAME = 'SampleObject'

let thread: Thread
let threadedFunction: ThreadedFunction

describe('Testing ThreadedFunction', () => {
  beforeEach(() => {
    thread = createThread()
    threadedFunction = new ThreadedFunction(thread, MODULE_SRC, EXPORT_NAME)
  })

  it('invokes a function', async () => {
    const EXPORT_NAME = 'add'
    const ARGS = [1, 2]
    const RESULT = Math.max(...ARGS)

    const threadedFunction = new ThreadedFunction(thread, MODULE_SRC, EXPORT_NAME)

    sinon.stub(thread, 'run').callsFake(task => {
      expect(task.type).equal(TaskType.InvokeFunction)
      expect(task.data).deep.equal([MODULE_SRC, EXPORT_NAME, ARGS] as InvokeFunctionData)
      return Promise.resolve(RESULT)
    })

    expect(await threadedFunction.invoke(ARGS)).equal(RESULT)
  })

  it('gets a static property', async () => {
    const PROP_NAME = 'sampleProp'
    const RESULT = 1

    sinon.stub(thread, 'run').callsFake(task => {
      expect(task.type).equal(TaskType.GetStaticProperty)
      expect(task.data).deep.equal([MODULE_SRC, EXPORT_NAME, PROP_NAME] as GetStaticPropertyData)
      return Promise.resolve(RESULT)
    })

    expect(await threadedFunction.getStaticProperty(PROP_NAME)).equal(RESULT)
  })

  it('sets a static property', async () => {
    const PROP_NAME = 'sampleProp'
    const VALUE = 1

    sinon.stub(thread, 'run').callsFake(task => {
      expect(task.type).equal(TaskType.SetStaticProperty)
      expect(task.data).deep.equal([MODULE_SRC, EXPORT_NAME, PROP_NAME, VALUE] as SetStaticPropertyData)
      return Promise.resolve(undefined)
    })

    expect(await threadedFunction.setStaticProperty(PROP_NAME, VALUE)).equal(undefined)
  })

  it('invokes a static method', async () => {
    const METHOD_NAME = 'sampleMethod'
    const ARGS = [1, 2]
    const RESULT = Math.max(...ARGS)

    sinon.stub(thread, 'run').callsFake(task => {
      expect(task.type).equal(TaskType.InvokeStaticMethod)
      expect(task.data).deep.equal([MODULE_SRC, EXPORT_NAME, METHOD_NAME, ARGS] as InvokeStaticMethodData)
      return Promise.resolve(RESULT)
    })

    expect(await threadedFunction.invokeStaticMethod(METHOD_NAME, ARGS)).equal(RESULT)
  })
})

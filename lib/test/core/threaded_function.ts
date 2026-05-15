import assert from 'node:assert'
import { describe, beforeEach, it } from 'node:test'

import sinon from 'sinon'

import { TaskType } from '../../src/core/constants.js'
import { ThreadedFunction } from '../../src/core/threaded_function.js'
import { createThread } from './common/helpers.js'

import type { Thread } from '../../src/core/thread.js'
import type {
  GetStaticPropertyData,
  InvokeFunctionData,
  InvokeStaticMethodData,
  SetStaticPropertyData
} from '../../src/core/types.js'

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
      assert.strictEqual(task.type, TaskType.InvokeFunction)
      assert.deepStrictEqual(task.data, [MODULE_SRC, EXPORT_NAME, ARGS] as InvokeFunctionData)
      return Promise.resolve(RESULT)
    })

    assert.strictEqual(await threadedFunction.invoke(ARGS), RESULT)
  })

  it('gets a static property', async () => {
    const PROP_NAME = 'sampleProp'
    const RESULT = 1

    sinon.stub(thread, 'run').callsFake(task => {
      assert.strictEqual(task.type, TaskType.GetStaticProperty)
      assert.deepStrictEqual(task.data, [MODULE_SRC, EXPORT_NAME, PROP_NAME] as GetStaticPropertyData)
      return Promise.resolve(RESULT)
    })

    assert.strictEqual(await threadedFunction.getStaticProperty(PROP_NAME), RESULT)
  })

  it('sets a static property', async () => {
    const PROP_NAME = 'sampleProp'
    const VALUE = 1

    sinon.stub(thread, 'run').callsFake(task => {
      assert.strictEqual(task.type, TaskType.SetStaticProperty)
      assert.deepStrictEqual(task.data, [MODULE_SRC, EXPORT_NAME, PROP_NAME, VALUE] as SetStaticPropertyData)
      return Promise.resolve(undefined)
    })

    assert.strictEqual(await threadedFunction.setStaticProperty(PROP_NAME, VALUE), undefined)
  })

  it('invokes a static method', async () => {
    const METHOD_NAME = 'sampleMethod'
    const ARGS = [1, 2]
    const RESULT = Math.max(...ARGS)

    sinon.stub(thread, 'run').callsFake(task => {
      assert.strictEqual(task.type, TaskType.InvokeStaticMethod)
      assert.deepStrictEqual(task.data, [MODULE_SRC, EXPORT_NAME, METHOD_NAME, ARGS] as InvokeStaticMethodData)
      return Promise.resolve(RESULT)
    })

    assert.strictEqual(await threadedFunction.invokeStaticMethod(METHOD_NAME, ARGS), RESULT)
  })
})

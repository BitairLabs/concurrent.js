import assert from 'node:assert'
import { describe, beforeEach, it } from 'node:test'

import sinon from 'sinon'

import { Constants } from '../../src/core/index.js'
import { Thread } from '../../src/core/thread.js'
import { ThreadMessageType, ErrorMessage } from '../../src/core/constants.js'
import { Coroutine } from '../../src/core/coroutine.js'
import {
  createInstantiateObjectTask,
  createWorker,
  createWorkerFactory,
  getThreadCoroutines,
  getWorkerErrorHandler,
  getWorkerMessageHandler,
  setThreadCoroutines
} from './common/helpers.js'

import type { ConcurrencyError } from '../../src/core/error.js'
import type { InstantiateObjectResult, IWorker, TaskInfo, ThreadMessage } from '../../src/core/types.js'

let worker: IWorker
let thread: Thread

describe('Testing Thread', () => {
  beforeEach(() => {
    worker = createWorker()
    thread = new Thread(createWorkerFactory(worker))
  })

  it('creates a thread', () => {
    assert.notStrictEqual(getWorkerMessageHandler(worker), undefined)
    assert.notStrictEqual(getWorkerErrorHandler(worker), undefined)
  })

  it('runs a task and resolves a result', async () => {
    const OBJECT_ID = 1
    const task = createInstantiateObjectTask()

    sinon.stub(worker, 'postMessage').callsFake((_message: ThreadMessage) => {
      const [coroutineId] = _message[1] as TaskInfo
      const message: ThreadMessage = [ThreadMessageType.Task, [coroutineId, task.type, task.data]]

      assert.deepStrictEqual(_message, message)
      assert.strictEqual(getThreadCoroutines(thread).size, 1)
      assert.notStrictEqual(getThreadCoroutines(thread).get(coroutineId), undefined)

      getWorkerMessageHandler(worker).call(worker, [
        ThreadMessageType.TaskCompleted,
        [coroutineId, undefined, [OBJECT_ID]]
      ])
    })

    const [objectId] = (await thread.run(task)) as InstantiateObjectResult

    assert.strictEqual(objectId, OBJECT_ID)
    assert.strictEqual(getThreadCoroutines(thread).size, 0)
  })

  it('runs a task and rejects an error', async () => {
    const task = createInstantiateObjectTask()

    sinon.stub(worker, 'postMessage').callsFake((_message: ThreadMessage) => {
      const [coroutineId] = _message[1] as TaskInfo

      getWorkerMessageHandler(worker).call(worker, [
        ThreadMessageType.TaskCompleted,
        [coroutineId, new Error(), undefined]
      ])
    })

    let error
    try {
      await thread.run(task)
    } catch (_error) {
      error = _error
    }

    assert.notStrictEqual(error, undefined)
    assert.strictEqual(getThreadCoroutines(thread).size, 0)
  })

  it('terminates', async () => {
    setThreadCoroutines(
      thread,
      new Map([
        [1, new Coroutine(1, () => undefined)],
        [2, new Coroutine(2, () => undefined)]
      ])
    )

    await thread.terminate()
    assert.strictEqual(getThreadCoroutines(thread).size, 0)

    let error
    try {
      await thread.run(createInstantiateObjectTask())
    } catch (_error) {
      error = _error
    }
    assert.strictEqual((error as ConcurrencyError).code, Constants.ErrorMessage.ThreadTerminated.code)
  })

  it('throws when receives an invalid message type', async () => {
    let error
    try {
      await getWorkerMessageHandler(worker).call(worker, [0, []])
    } catch (_error) {
      error = _error
    }

    assert.strictEqual((error as ConcurrencyError).code, ErrorMessage.InvalidThreadMessageType.code)
  })

  it('throws when receives a task result with an unregistered coroutine', async () => {
    let error
    try {
      await getWorkerMessageHandler(worker).call(worker, [ThreadMessageType.TaskCompleted, [0]])
    } catch (_error) {
      error = _error
    }

    assert.strictEqual((error as ConcurrencyError).code, ErrorMessage.CoroutineNotFound.code)
  })

  it('handles the onerror event', (_t, done) => {
    const create = sinon.spy(() => worker)
    const thread = new Thread({ create })
    const task = createInstantiateObjectTask()

    let calledTwice
    try {
      thread.run(task).catch(error => {
        assert.strictEqual((error as ConcurrencyError).code, ErrorMessage.InternalError.code)
        done()
      })
      getWorkerErrorHandler(worker).call(worker, new Error())
    } catch {
      calledTwice = create.calledTwice
    }

    assert.strictEqual(calledTwice, true)
  })
})

import { expect } from 'chai'
import sinon from 'sinon'

import { ErrorMessage, ThreadMessageType } from '../../src/core/constants.js'
import { Coroutine } from '../../src/core/coroutine.js'
import { Thread } from '../../src/core/thread.js'
import {
  createInstantiateObjectTask,
  createWorker,
  createWorkerFactory,
  getThreadCoroutines,
  getWorkerErrorHandler,
  getWorkerMessageHandler,
  setThreadCoroutines
} from './common/helpers.js'

import type { InstantiateObjectResult, IWorker, TaskInfo, ThreadMessage } from '../../src/core/types.js'
import type { ConcurrencyError } from '../../src/core/error.js'
import { Constants } from '../../src/core/index.js'

let worker: IWorker
let thread: Thread

describe('Testing Thread', () => {
  beforeEach(() => {
    worker = createWorker()
    thread = new Thread(createWorkerFactory(worker))
  })

  it('creates a thread', () => {
    expect(getWorkerMessageHandler(worker)).not.undefined
    expect(getWorkerErrorHandler(worker)).not.undefined
  })

  it('runs a task and resolves a result', async () => {
    const OBJECT_ID = 1
    const task = createInstantiateObjectTask()

    sinon.stub(worker, 'postMessage').callsFake((_message: ThreadMessage) => {
      const [coroutineId] = _message[1] as TaskInfo
      const message: ThreadMessage = [ThreadMessageType.RunTask, [coroutineId, task.type, task.data]]

      expect(_message).deep.equal(message)
      expect(getThreadCoroutines(thread).size).equal(1)
      expect(getThreadCoroutines(thread).get(coroutineId)).not.undefined

      getWorkerMessageHandler(worker).call(worker, [
        ThreadMessageType.ReadTaskResult,
        [coroutineId, undefined, [OBJECT_ID]]
      ])
    })

    const [objectId] = (await thread.run(task)) as InstantiateObjectResult

    expect(objectId).equal(OBJECT_ID)
    expect(getThreadCoroutines(thread).size).equal(0)
  })

  it('runs a task and rejects an error', async () => {
    const task = createInstantiateObjectTask()

    sinon.stub(worker, 'postMessage').callsFake((_message: ThreadMessage) => {
      const [coroutineId] = _message[1] as TaskInfo

      getWorkerMessageHandler(worker).call(worker, [
        ThreadMessageType.ReadTaskResult,
        [coroutineId, new Error(), undefined]
      ])
    })

    let error
    try {
      await thread.run(task)
    } catch (_error) {
      error = _error
    }

    expect(error).not.undefined
    expect(getThreadCoroutines(thread).size).equal(0)
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
    expect(getThreadCoroutines(thread).size).equal(0)

    let error
    try {
      await thread.run(createInstantiateObjectTask())
    } catch (_error) {
      error = _error
    }
    expect((error as ConcurrencyError).code).equal(Constants.ErrorMessage.ThreadTerminated.code)
  })

  it('throws when receives an invalid message type', async () => {
    let error
    try {
      getWorkerMessageHandler(worker).call(worker, [0, []])
    } catch (_error) {
      error = _error
    }

    expect((error as ConcurrencyError).code).equal(ErrorMessage.InvalidMessageType.code)
  })

  it('throws when receives a task result with an unregistered coroutine', async () => {
    let error
    try {
      getWorkerMessageHandler(worker).call(worker, [ThreadMessageType.ReadTaskResult, [0]])
    } catch (_error) {
      error = _error
    }

    expect((error as ConcurrencyError).code).equal(ErrorMessage.CoroutineNotFound.code)
  })

  it('handles the onerror event', done => {
    const create = sinon.spy(() => worker)
    const thread = new Thread({ create })
    const task = createInstantiateObjectTask()

    let calledTwice
    try {
      thread.run(task).catch(error => {
        expect((error as ConcurrencyError).code).equal(ErrorMessage.InternalError.code)
        done()
      })
      getWorkerErrorHandler(worker).call(worker, new Error())
    } catch (error) {
      calledTwice = create.calledTwice
    }

    expect(calledTwice).true
  })
})

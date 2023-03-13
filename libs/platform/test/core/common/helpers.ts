/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { WorkerBase } from '../../../src/core/worker_base.js'

import type { Coroutine } from '../../../src/core/coroutine.js'
import type { Thread } from '../../../src/core/thread.js'
import type {
  IWorker,
  WorkerMessageHandler,
  WorkerErrorHandler,
  Dict,
  IWorkerFactory,
  InstantiateObjectData
} from '../../../src/core/types.js'
import { defaultThreadPoolSettings, TaskType } from '../../../src/core/constants.js'
import { Task } from '../../../src/core/task.js'
import { ThreadPool } from '../../../src/core/thread_pool.js'
import type { ThreadPoolSettings } from '../../../src/index.js'

export function createSampleValueDict(): Dict<unknown> {
  return {
    undefined: undefined,
    null: null,
    Infinity: Infinity,
    NaN: NaN,
    booleanTrue: true,
    booleanFalse: false,
    numberIntegerZero: 0,
    numberIntegerOne: 1,
    numberFloatOne: 1.0,
    bigintZero: 0n,
    bigintOne: 1n,
    stringEmpty: '',
    stringNonEmpty: 'text',
    stringNumberIntegerZero: '0',
    stringNumberIntegerOne: '1',
    stringNumberFloatOne: '1.0',
    symbol: Symbol(),
    function: new Function(),
    object: {}
  }
}

export function createThreadPool(settings: Partial<ThreadPoolSettings> = {}) {
  return new ThreadPool(createWorkerFactory(), Object.assign(defaultThreadPoolSettings, settings))
}

export function createWorkerFactory(worker?: IWorker): IWorkerFactory {
  return {
    create(): IWorker {
      return worker ?? createWorker()
    }
  }
}

export function createWorker() {
  return new WorkerBase({
    postMessage(_message: unknown) {},
    terminate() {}
  })
}

export function createInstantiateObjectTask() {
  const taskType = TaskType.InstantiateObject
  const taskData: InstantiateObjectData = ['moduleSrc', 'exportName', []]
  return new Task<InstantiateObjectData>(taskType, taskData)
}

export function getWorkerMessageHandler(worker: IWorker) {
  return Reflect.get(worker, 'messageHandler') as WorkerMessageHandler
}

export function getWorkerErrorHandler(worker: IWorker) {
  return Reflect.get(worker, 'errorHandler') as WorkerErrorHandler
}

export function getThreadCoroutines(thread: Thread) {
  return Reflect.get(thread, 'coroutines') as Map<number, Coroutine>
}

export function setThreadCoroutines(thread: Thread, value: Map<number, Coroutine>) {
  return Reflect.set(thread, 'coroutines', value)
}

export function getThreadPoolThreads(threadPool: ThreadPool) {
  return Reflect.get(threadPool, 'threads') as Thread[]
}

export function getThreadPoolSettings(threadPool: ThreadPool) {
  return Reflect.get(threadPool, 'settings') as ThreadPoolSettings[]
}

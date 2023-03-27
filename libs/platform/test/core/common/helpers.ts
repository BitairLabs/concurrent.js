/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { defaultThreadPoolSettings, TaskType } from '../../../src/core/constants.js'
import { Task } from '../../../src/core/task.js'
import { Thread } from '../../../src/core/thread.js'
import { ThreadPool } from '../../../src/core/thread_pool.js'
import { WorkerBase } from '../../../src/core/worker_base.js'

import { Coroutine } from '../../../src/core/coroutine.js'
import type {
  IWorker,
  WorkerMessageHandler,
  WorkerErrorHandler,
  Dict,
  IWorkerFactory,
  InstantiateObjectData
} from '../../../src/core/types.js'
import type { ThreadPoolSettings } from '../../../src/index.js'

export function sleep(seconds: number | undefined = 0) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      clearInterval(timer)
      resolve(true)
    }, seconds * 1000)
  })
}

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

export function createThread() {
  return new Thread(createWorkerFactory())
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

export function getLastCoroutineId() {
  return Reflect.get(Coroutine, 'lastCoroutineId') as number
}
class SampleObjectBase {
  _sampleBaseField = true
  get sampleBaseProp() {
    return this._sampleBaseField
  }
  set sampleBaseProp(val) {
    this._sampleBaseField = val
  }
  sampleBaseMethod() {}
}

export class SampleObject extends SampleObjectBase {
  _sampleField = true
  get sampleProp() {
    return this._sampleField
  }
  set sampleProp(val) {
    this._sampleField = val
  }
  sampleMethod() {}
}

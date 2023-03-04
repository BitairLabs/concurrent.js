export enum ThreadMessageType {
  RunTask = 1,
  ReadTaskResult
}

export enum TaskType {
  InstantiateObject = 1,
  GetInstanceProperty,
  SetInstanceProperty,
  InvokeInstanceMethod,
  DisposeObject,
  InvokeFunction
}

export const ErrorMessage = {
  InternalError: { code: 500, text: 'Internal error has occurred.' },
  InvalidMessageType: { code: 502, text: "Can't handle a message with the type '%{1}'." },
  InvalidTaskType: { code: 503, text: "Can't handle a task with the type '%{1}'" },
  CoroutineNotFound: { code: 504, text: "Couldn't find a coroutine with the ID '%{1}'." },
  ObjectNotFound: { code: 505, text: "Couldn't find an object with the ID '%{1}'" },
  NotRunningOnWorker: { code: 506, text: 'This module must be run on a worker.' },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 509, text: 'Thread allocation failed due to timeout.' }
}

export enum ValueType {
  Function = 1,
  Any
}

export const SYMBOL = {
  DISPOSE: Symbol('DISPOSE')
}

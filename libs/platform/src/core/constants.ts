export enum ThreadMessageType {
  RunTask = 1,
  ReadTaskResult
}

export enum TaskType {
  InvokeFunction = 1,
  GetStaticProperty,
  SetStaticProperty,
  InvokeStaticMethod,
  InstantiateObject,
  GetInstanceProperty,
  SetInstanceProperty,
  InvokeInstanceMethod,
  DisposeObject
}

export const ErrorMessage = {
  InternalError: { code: 500, text: 'Internal error has occurred.' },
  InvalidMessageType: { code: 502, text: "Can't handle a message with the type '%{0}'." },
  InvalidTaskType: { code: 503, text: "Can't handle a task with the type '%{0}'" },
  CoroutineNotFound: { code: 504, text: "Couldn't find a coroutine with the ID '%{0}'." },
  ObjectNotFound: { code: 505, text: "Couldn't find an object with the ID '%{0}'" },
  NotRunningOnWorker: { code: 506, text: 'This module must be run on a worker.' },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 508, text: 'Thread allocation failed due to timeout.' },
  MethodAssignment: { code: 509, text: "Can't assign a method." },
  NonFunctionLoad: { code: 510, text: "Can't load an export of type '%{0}'." }
}

export enum ValueType {
  Function = 'function',
  Undefined = 'undefined'
}

export const SYMBOL = {
  DISPOSE: Symbol('DISPOSE')
}

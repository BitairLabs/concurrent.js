import type { ThreadPoolSettings } from '../index.js'

export enum ThreadMessageType {
  Task = 1,
  DirectMessage,
  DirectMessageReplied,
  TaskCompleted
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
  InvalidThreadMessageType: { code: 502, text: "Cannot handle a thread message with the type '%{0}'." },
  InvalidTaskType: { code: 503, text: "Cannot handle a task with the type '%{0}'" },
  CoroutineNotFound: { code: 504, text: "Cannot find a coroutine with the ID '%{0}'." },
  ObjectNotFound: { code: 505, text: "Cannot find an object with the ID '%{0}'" },
  NotRunningOnWorker: { code: 506, text: 'This module must be run on a worker.' },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 508, text: 'Thread allocation failed due to timeout.' },
  MethodAssignment: { code: 509, text: 'Cannot assign a method.' },
  NotAccessibleExport: {
    code: 510,
    text: "Cannot access an export of type '%{0}'. Only top level functions and classes are imported."
  },
  ThreadPoolTerminated: { code: 511, text: 'Thread pool has been terminated.' },
  ThreadTerminated: { code: 512, text: 'Thread has been terminated.' },
  UnrecognizedModuleType: {
    code: 513,
    text: "A module with an unrecognized type has been passed '%{0}'."
  },
  UnexportedFunction: {
    code: 514,
    text: "No function with the name '%{0}' has been exported in module '{%1}'."
  },
  TooManyChannelProvided: {
    code: 515,
    text: 'More than one channel has been provided for the task.'
  },
  UsedChannelProvided: {
    code: 516,
    text: 'The provided channel has already been used for another task.'
  },
  ChannelNotFound: {
    code: 517,
    text: "Cannot find a channel for a coroutine with the ID '{%1}'"
  },
  MessageNotFound: {
    code: 518,
    text: "Cannot find a message with the ID '{%1}'"
  }
}

export const ValueType = {
  undefined: 1,
  boolean: 2,
  number: 3,
  bigint: 4,
  string: 5,
  symbol: 6,
  function: 7,
  object: 8
}

export const defaultThreadPoolSettings: ThreadPoolSettings = {
  maxThreads: 1,
  minThreads: 0,
  threadIdleTimeout: Infinity
}

export const defaultConcurrencySettings = Object.assign(
  {
    disabled: false
  },
  defaultThreadPoolSettings
)

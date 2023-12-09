import { TaskType } from './constants.js'

export function isInvocableTask(type: TaskType) {
  return [TaskType.InvokeFunction, TaskType.InvokeStaticMethod, TaskType.InvokeInstanceMethod].includes(type)
}

export function hasChannel(type: TaskType, data: unknown[]) {
  return isInvocableTask(type) && data[getChannelFlagIndex(type)]
}

export function getChannelFlagIndex(type: TaskType) {
  return type === TaskType.InvokeStaticMethod ? 4 : 3
}

export function getTaskArgs(type: TaskType, data: unknown[]) {
  const argsIndex = type === TaskType.InvokeStaticMethod ? 3 : 2
  return data[argsIndex] as unknown[]
}

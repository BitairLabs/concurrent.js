import { ErrorMessage, TaskType } from './constants.js'
import { ConcurrencyError } from './error.js'

export class Task<T extends unknown[]> {
  constructor(public type: TaskType, public data: T) {
    if (!TaskType[type]) throw new ConcurrencyError(ErrorMessage.InvalidTaskType, type)
  }
}

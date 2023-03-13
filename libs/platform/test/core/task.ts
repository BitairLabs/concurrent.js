import { expect } from 'chai'

import { ErrorMessage, TaskType } from '../../src/core/constants.js'
import { ConcurrencyError } from '../../src/core/error.js'
import { Task } from '../../src/core/task.js'

describe('Testing Task', () => {
  it('creates a task', () => {
    const task = new Task(TaskType.DisposeObject, [1])

    expect(task.type).equal(TaskType.DisposeObject)
    expect(task.data).deep.equal([1])
  })

  it('throws when passing an invalid task type', done => {
    try {
      new Task(0, [1])
    } catch (error) {
      expect(error).instanceOf(ConcurrencyError)
      expect((error as ConcurrencyError).code).equal(ErrorMessage.InvalidTaskType.code)
      done()
    }
  })
})

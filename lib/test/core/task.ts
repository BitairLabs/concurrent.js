import assert from 'node:assert'
import { describe, it } from 'node:test'

import { ErrorMessage, TaskType } from '../../src/core/constants.js'
import { ConcurrencyError } from '../../src/core/error.js'
import { Task } from '../../src/core/task.js'

describe('Testing Task', () => {
  it('creates a task', () => {
    const task = new Task(TaskType.DisposeObject, [1])

    assert.strictEqual(task.type, TaskType.DisposeObject)
    assert.deepStrictEqual(task.data, [1])
  })

  it('throws when passing an invalid task type', (_t, done) => {
    try {
      new Task(0 as TaskType, [1])
    } catch (error) {
      assert.strictEqual(error instanceof ConcurrencyError, true)
      assert.strictEqual((error as ConcurrencyError).code, ErrorMessage.InvalidTaskType.code)
      done()
    }
  })
})

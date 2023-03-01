import { expect } from 'chai'
import { cpus } from 'node:os'

import { Constants } from '../src/core/index.js'
import concurrent from '../src/node/index.js'

import type * as Services from './sample_services/index.js'
import type { ConcurrencyError } from '../src/core/error.js'

const THREAD_INSTANTIATION_DELAY = 0.5
const SERVICES_SRC = new URL('../build/services/index.js', import.meta.url)
const { Calculator, add } = await concurrent.load<typeof Services>(SERVICES_SRC)

describe('Testing Master', () => {
  before(() => {
    process.env['BASE_URL'] = new URL('../build/', import.meta.url).href
  })

  after(async () => {
    await concurrent.terminate()
  })

  it('should create a proxy for an exported class', async () => {
    const calculator = new Calculator()
    expect(Calculator.name).to.be.equal('ExportProxy')
    await concurrent.dispose(calculator)
  })

  it('should instantiate an object', async () => {
    const calculator = new Calculator()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((calculator as any).dispose).to.not.be.null
    await concurrent.dispose(calculator)
  })

  it('should create proxy for every method', async () => {
    const calculator = new Calculator()
    expect(calculator.precision.name).to.be.equal('invoke')
    expect(calculator.divide.name).to.be.equal('invoke')
    expect(calculator.isPrime.name).to.be.equal('invoke')
    await concurrent.dispose(calculator)
  })

  it('should invoke a method', async () => {
    const calculator = new Calculator()
    const result = await calculator.add(1, 1)
    await concurrent.dispose(calculator)
    expect(result).to.be.equal(2)
  })

  it('should invoke a method that uses another module', async () => {
    const calculator = new Calculator()
    const result = await calculator.isPrime(5)
    await concurrent.dispose(calculator)
    expect(result).to.be.equal(true)
  })

  it('should instantiate an object with args', async () => {
    const calculator = new Calculator(2)
    const result = await calculator.precision()
    await concurrent.dispose(calculator)
    expect(result).to.be.equal(2)
  })

  it('should run multiple operations in parallel', async () => {
    concurrent.config({
      maxThreads: cpus().length
    })

    const { Calculator } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    console.log(cpus().length)

    const DELAY = 0.1
    const ops: Promise<boolean>[] = []
    for (let i = 0; i < cpus().length * 20; i++) {
      const calculator = new Calculator()
      ops.push(
        Promise.resolve(calculator.isPrime(i, DELAY)).then(async result => {
          await concurrent.dispose(calculator)
          return result
        })
      )
    }

    const startTime = performance.now()
    await Promise.all(ops)
    const endTime = performance.now()

    expect((endTime - startTime) / 1000).to.be.lessThan(ops.length * DELAY + cpus().length * THREAD_INSTANTIATION_DELAY)
  })

  it('should bubble up an unhandled exception', async () => {
    const calculator = new Calculator(2, true)
    try {
      await calculator.divide(1, 0)
    } catch (error) {
      expect((error as Error).message).to.be.equal('Division by zero')
    }
    await concurrent.dispose(calculator)
  })

  it('should explicitly deconstruct an instance', async () => {
    const calculator = new Calculator()
    await concurrent.dispose(calculator)
    try {
      await calculator.isPrime(5)
    } catch (error) {
      expect((error as ConcurrencyError).code).to.be.equal(Constants.ErrorMessage.ObjectNotFound).true
    }
  })

  it('should implicitly deconstruct an instance', async () => {
    concurrent.config({
      maxThreads: cpus().length
    })

    const { Calculator } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    const results: boolean[] = []
    for (let i = 0; i < cpus().length; i++) {
      const calculator = new Calculator()
      const result = await calculator.isPrime(i)
      results.push(result)
    }

    const calculator = new Calculator()
    const result = await calculator.isPrime(4)
    results.push(result)

    expect(results.length).to.deep.equal(cpus().length + 1)
  })

  it('should throw thread allocation timeout', async () => {
    const { Calculator } = await concurrent.load<typeof Services>(SERVICES_SRC, {
      parallel: true
    })

    concurrent.config({
      threadAllocationTimeout: 0.001
    })

    let calculator
    try {
      const calculator = new Calculator()
      await calculator.isPrime(5)
    } catch (error) {
      concurrent.dispose(calculator)
      expect((error as ConcurrencyError).code).to.be.equal(Constants.ErrorMessage.ThreadAllocationTimeout.code)
    }

    concurrent.config({
      threadAllocationTimeout: Infinity
    })
  })

  it('should invoke an exported function', async () => {
    const result = await add(1, 1)
    expect(result).to.be.equal(2)
  })
})

import { AdvancedCalculator } from './advanced_calculator.js'

export class Calculator {
  private _precision: number
  advanced: AdvancedCalculator

  constructor(precision?: number, private divisionByZeroError?: boolean) {
    this._precision = precision ?? 2
    this.divisionByZeroError = divisionByZeroError

    this.advanced = new AdvancedCalculator()
  }

  precision() {
    return this._precision
  }

  add(x: number, y: number) {
    return x + y
  }

  divide(x: number, y: number) {
    if (this.divisionByZeroError && y == 0) throw new Error('Division by zero')
    return this.format(x / y)
  }

  async isPrime(n: number, delay?: number) {
    const startTime = performance.now()
    while (delay && performance.now() - startTime < delay * 1000);
    return this.advanced.isPrime(n)
  }

  private format(n: number) {
    return parseFloat(n.toFixed(this.precision()))
  }
}

export function add(x: number, y: number) {
  return x + y
}

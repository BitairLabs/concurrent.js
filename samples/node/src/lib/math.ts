import * as ExtraBigInt from 'extra-bigint'

export function factorial(n: bigint) {
  return ExtraBigInt.factorial(n)
}

export function isPrime(n: bigint) {
  return ExtraBigInt.isPrime(n)
}

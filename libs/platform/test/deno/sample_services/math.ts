export function isWorker() {
  return !!Reflect.get(self, 'postMessage')
}

export function isPrime(n: number) {
  const j = Math.sqrt(n)
  for (let i = 2; i <= j; i++) {
    if (n % i === 0) return false
  }
  return n > 1
}

export function divide(x: number, y: number) {
  if (!y) throw new Error('Division by zero')

  return x / y
}

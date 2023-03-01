export class AdvancedCalculator {
  isPrime(n: number) {
    const j = Math.sqrt(n)
    for (let i = 2; i <= j; i++) {
      if (n % i === 0) return false
    }
    return n > 1
  }
}

import { concurrent } from '@bitair/concurrent.js'

declare type MathModule = {
  factorial: (n: bigint) => Promise<bigint>
}

const MATH_MODULE_SRC = './lib/math.js'
const TASK_COUNT = 10
const N_VALUE = 50_000n

concurrent.config({
  maxThreads: TASK_COUNT
})

const taskCountElm = document.querySelector('#task_count') as HTMLBodyElement
const nValueElm = document.querySelector('#n_value') as HTMLBodyElement
const progressElm = document.querySelector('#progress') as HTMLBodyElement
const resultsElm = document.querySelector('#results') as HTMLBodyElement
const summaryElm = document.querySelector('#summary') as HTMLBodyElement
const durationElm = document.querySelector('#duration') as HTMLBodyElement
const digitCountElm = document.querySelector('#digit_count') as HTMLBodyElement
const summaryNValueElm = document.querySelector('#summary_n_value') as HTMLBodyElement

taskCountElm.innerHTML = `${TASK_COUNT}`
nValueElm.innerHTML = `${N_VALUE.toLocaleString()}`

// Create an interval to show that the main thread remains responsive
const progressbarTimer = setInterval(() => (progressElm.innerHTML += '■'), 100)

const start = performance.now()

const tasks = []

for (let i = 0; i < TASK_COUNT; i++) {
  resultsElm.innerHTML += `<div id="result${i}" class="result">i=${i} </div>`

  const { factorial } = await concurrent.import<MathModule>(new URL(MATH_MODULE_SRC, import.meta.url)).load()

  tasks.push(
    factorial(N_VALUE).then(result => {
      const resultElm = document.querySelector(`#result${i}`) as HTMLBodyElement
      resultElm.innerHTML += `<b class="checked">✓</b>`
      return result
    })
  )
}

const results = await Promise.all(tasks)

const end = performance.now()

clearInterval(progressbarTimer)

const duration = Math.trunc(end - start) / 1000

progressElm.innerHTML += `${duration}s.`
durationElm.innerHTML = `${duration}`
digitCountElm.innerHTML = BigInt(results[0]).toString().length.toLocaleString()
summaryNValueElm.innerHTML = N_VALUE.toLocaleString()
summaryElm.className = ''

await concurrent.terminate()

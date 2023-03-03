import { DenoWorker } from './worker.js'
import { AsyncSetter, Master } from '../core/index.js'

const concurrent = new Master({
  create: () => {
    const src = new URL('./worker_script.js', import.meta.url)
    return new DenoWorker(src)
  }
})

const setAsync = AsyncSetter.create

export { concurrent, setAsync as AsyncSetter }

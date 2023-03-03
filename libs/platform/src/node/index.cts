import { NodeWorker } from './worker.js'
import { AsyncSetter, Master } from '../core/index.js'

const concurrent = new Master({
  create: () => {
    const BASE_URL = process.env['BASE_URL']
    const src = new URL('./worker_script.js', new URL(BASE_URL || `file:${__filename}`))
    return new NodeWorker(src)
  }
})

const setAsync = AsyncSetter.create

export { concurrent, setAsync as AsyncSetter }

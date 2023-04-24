import { NodeWorker } from './worker.js'
import { Master } from '../core/index.js'
import { ExternFunctionReturnType } from '../core/constants.js'

const concurrent = new Master({
  create: () => {
    const BASE_URL = process.env['BASE_URL']
    const src = new URL('./worker_script.js', BASE_URL ? new URL(BASE_URL) : import.meta.url)
    return new NodeWorker(src)
  }
})

export { concurrent, ExternFunctionReturnType }

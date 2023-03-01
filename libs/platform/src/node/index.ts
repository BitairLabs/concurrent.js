import { NodeWorker } from './worker.js'
import { Master } from '../core/index.js'

import type { IConcurrent } from '../index.js'

const master = new Master({
  create: () => {
    const BASE_URL = process.env['BASE_URL']
    const src = new URL('./worker_script.js', BASE_URL ? new URL(BASE_URL) : import.meta.url)
    return new NodeWorker(src)
  }
})

export default master as IConcurrent

import { BrowserWorker } from './worker.js'
import { Master } from '../core/index.js'

const concurrent = new Master({
  create: () => {
    const src = new URL('./worker_script.js', import.meta.url)
    return new BrowserWorker(src)
  }
})

export { concurrent }

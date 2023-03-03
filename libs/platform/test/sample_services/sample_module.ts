import { format } from 'node:util'
import { isMainThread } from 'node:worker_threads'
import { isPrime } from './math.js'

class BaseClass {
  _version = '1.0.0'
  get version() {
    return this._version
  }
  set version(value) {
    this._version = value
  }
  getVersion() {
    return this.version
  }
}

export class SampleObject extends BaseClass {
  public isWorker = !isMainThread

  constructor(public _data?: number[]) {
    super()
  }

  set data(value) {
    this._data = value
  }

  get data() {
    return this._data
  }

  setData(value: number[]) {
    this.data = value
  }

  getData() {
    return this.data
  }

  async echoAsync(text: string) {
    return await new Promise(resolve => {
      setTimeout(() => {
        resolve(text)
      })
    })
  }

  isPrime(x: number) {
    return isPrime(x)
  }

  format(str: string, ...params: unknown[]) {
    return format(str, ...params)
  }
}

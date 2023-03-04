import { format } from 'node:util'
import { isMainThread } from 'node:worker_threads'
import { isPrime } from './math.js'

class BaseClass {
  constructor(public _baseData?: number[]) {}

  set baseData(value) {
    this._baseData = value
  }

  get baseData() {
    return this._baseData
  }

  setBaseData(value: number[]) {
    return (this._baseData = value)
  }
  
  getBaseData() {
    return this._baseData
  }

  overridableGetBaseData() {
    return this.baseData
  }

  async setBaseDataAsync(value: number[]) {
    new Promise(resolve => {
      setTimeout(() => {
        this.baseData = value
        resolve(true)
      })
    })
  }

  async getBaseDataAsync() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.baseData)
      })
    })
  }
}

export class SampleObject extends BaseClass {
  public isWorker = !isMainThread

  constructor(public _data?: number[]) {
    super(_data)
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

  override overridableGetBaseData() {
    return this.data
  }

  async setDataAsync(value: number[]) {
    new Promise(resolve => {
      setTimeout(() => {
        this.data = value
        resolve(true)
      })
    })
  }

  async getDataAsync() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.data)
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

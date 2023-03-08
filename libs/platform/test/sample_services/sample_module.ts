import { format } from 'node:util'
import { isMainThread } from 'node:worker_threads'
import { isPrime } from './math.js'

class BaseClass {
  static _staticBaseData: number[]

  constructor(public _baseData?: number[]) {}

  static set staticBaseData(value) {
    this._staticBaseData = value
  }

  static get staticBaseData() {
    return this._staticBaseData
  }

  static setStaticBaseData(value: number[]) {
    return (this._staticBaseData = value)
  }

  static getStaticBaseData() {
    return this._staticBaseData
  }

  static overridableGetStaticBaseData() {
    return this.staticBaseData
  }

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
  static staticIsWorker = !isMainThread
  static _staticData: number[]

  public isWorker = !isMainThread

  constructor(public _data?: number[]) {
    super(_data)
  }

  static set staticData(value) {
    this._staticData = value
  }

  static get staticData() {
    return this._staticData
  }

  static setStaticData(value: number[]) {
    this.staticData = value
  }

  static getStaticData() {
    return this.staticData
  }

  static override overridableGetStaticBaseData() {
    return this.staticData
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

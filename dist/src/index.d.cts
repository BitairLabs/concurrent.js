declare const concurrent: IConcurrent
declare const AsyncSetter: <T>(value: T) => T
export { concurrent, AsyncSetter }

export declare interface IConcurrent {
  set(setter: unknown): Promise<void>
  config(settings: Partial<ConcurrencySettings>): void
  load<T>(src: string | URL, settings?: Partial<ExecutionSettings>): Promise<T>
  descale(force?: boolean): Promise<void>
  terminate(force?: boolean): Promise<void>
  start(): Promise<void>
  dispose(obj: unknown): Promise<void>
}

export interface IAsyncSetter {
  value: unknown
  done(error?: Error): void
  wait(): Promise<void>
}

export declare type ConcurrencySettings = {
  disabled: boolean
} & ThreadPoolSettings

export declare type ThreadPoolSettings = {
  maxThreads: number
  minThreads: number
  threadAllocationTimeout: number | typeof Infinity
  threadIdleTimeout: number | typeof Infinity
}

export declare type ExecutionSettings = {
  parallel: boolean
  timeout: number | typeof Infinity
}

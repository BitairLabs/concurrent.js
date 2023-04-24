declare const concurrent: IConcurrent
export { concurrent, ExternFunctionReturnType }

export declare interface IConcurrent {
  config(settings: Partial<ConcurrencySettings>): void
  import<T>(moduleSrc: URL | string, options: ModuleImportOptions): IConcurrentModule<T>
  terminate(force?: boolean): Promise<void>
}

export declare type ConcurrencySettings = {
  disabled: boolean
} & ThreadPoolSettings

export declare type ThreadPoolSettings = {
  maxThreads: number
  minThreads: number
  threadIdleTimeout: number | typeof Infinity
}

export declare interface IConcurrentModule<T> {
  load: () => Promise<T>
}

export type ModuleImportOptions = Partial<{
  extern: {
    [key: string]: number
  }
}>

declare enum ExternFunctionReturnType {
  ArrayBuffer,
  Boolean,
  Number,
  String
}

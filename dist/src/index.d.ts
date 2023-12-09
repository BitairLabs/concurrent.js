declare const concurrent: IConcurrent
export { concurrent, Channel }

export declare interface IConcurrent {
  config(settings: Partial<ConcurrencySettings>): void
  import<T>(moduleSrc: URL | string): IConcurrentModule<T>
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

declare class Channel implements IChannel {
  constructor(listener: (onmessage: Channel['onmessage'], postMessage: Channel['postMessage']) => void)
  onmessage(handler: (name: string | number, ...data: unknown[]) => unknown): void
  postMessage(name: string | number, ...data: unknown[]): Promise<unknown>
}

export declare interface IChannel {
  onmessage(handler: (name: string | number, ...data: unknown[]) => unknown): void
  postMessage(name: string | number, ...data: unknown[]): Promise<unknown>
}

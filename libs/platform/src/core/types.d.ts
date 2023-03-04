export declare interface IWorkerFactory {
  create(): IWorker
}
export declare interface IWorker {
  postMessage(message: ThreadMessage): void
  onmessage(handler: WorkerMessageHandler): void
  onerror(handler: WorkerErrorHandler): void
  terminate(): void
}

export declare type ThreadMessage = [type: number, data: unknown]

export declare type TaskInfo = [coroutineId: number, type: number, data: unknown[]]
export declare type TaskResult = [
  coroutineId: number,
  error: IConcurrencyError | Error | undefined,
  result: unknown | undefined
]
export declare interface IConcurrencyError {
  code: number
  message: string
}

export declare type InstantiateObjectData = [moduleSrc: string, exportName: string, ctorArgs: unknown[]]
export declare type InstantiateObjectResult = [id: number, propertyTypeMap: Dict<number>]
export declare type GetInstancePropertyData = [objectId: number, propName: string]
export declare type SetInstancePropertyData = [objectId: number, propName: string, value: unknown]
export declare type InvokeInstanceMethodData = [objectId: number, methodName: string, args: unknown[]]
export declare type DisposeObjectData = [objectId: number]
export declare type InvokeFunctionData = [moduleSrc: string, functionName: string, args: unknown[]]
export declare type DoneCallBack = (error: Error | undefined, result: unknown) => void

export declare type WorkerMessageHandler = (message: ThreadMessage) => void
export declare type WorkerErrorHandler = (error: Error) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
export declare type Constructor = new (...params: any[]) => {}
export declare type Dict<T> = { [key: string]: T | undefined }

export declare type FunctionProxy = {
  invoke: (args: unknown[]) => Promise<unknown>
}

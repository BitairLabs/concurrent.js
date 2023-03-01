import { ModuleLoader } from './module_loader.js'
import { ThreadPool } from './thread_pool.js'
import { getBoolean, getNumber } from './utils.js'

import type { ConcurrencySettings, ExecutionSettings, IConcurrent } from '../index.d.js'
import type { IWorkerFactory } from './types.js'

export class Master implements IConcurrent {
  private settings: ConcurrencySettings
  private moduleLoader?: ModuleLoader | undefined
  private pool?: ThreadPool | undefined
  private started = false

  constructor(private workerFactory: IWorkerFactory) {
    this.settings = {
      disabled: false,
      maxThreads: 1,
      minThreads: 0,
      threadAllocationTimeout: Infinity,
      threadIdleTimeout: Infinity
    }
  }

  config(settings: Partial<ConcurrencySettings>): void {
    settings = settings ?? {}
    this.settings = {
      disabled: getBoolean(settings.disabled) ?? this.settings.disabled,
      maxThreads: getNumber(settings.maxThreads) || this.settings.maxThreads,
      minThreads: getNumber(settings.minThreads) ?? this.settings.minThreads,
      threadAllocationTimeout: getNumber(settings.threadAllocationTimeout) || this.settings.threadAllocationTimeout,
      threadIdleTimeout: getNumber(settings.threadIdleTimeout) || this.settings.threadIdleTimeout
    }
    if (this.started) (this.pool as ThreadPool).config(this.settings)
  }

  async load<T>(moduleSrc: string | URL, _settings?: Partial<ExecutionSettings>): Promise<T> {
    moduleSrc = moduleSrc.toString()

    if (!this.settings.disabled && !this.started) this.start()

    _settings = _settings ?? {}
    const settings = {
      parallel: getBoolean(_settings?.parallel) ?? false,
      timeout: getNumber(_settings.timeout) || Infinity
    }

    return (
      this.settings.disabled ? await import(moduleSrc) : (this.moduleLoader as ModuleLoader).load(moduleSrc, settings)
    ) as T
  }

  async descale(force?: boolean): Promise<void> {
    await this.pool?.descale(!!force)
  }

  async start() {
    if (!this.started) {
      this.pool = new ThreadPool(this.workerFactory, this.settings)
      this.moduleLoader = new ModuleLoader(this.pool)
      this.started = true
    }
  }

  async terminate(force?: boolean) {
    if (this.started) {
      await (this.pool as ThreadPool).terminate(!!force)
      this.moduleLoader = undefined
      this.pool = undefined
      this.started = false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async dispose(obj: any) {
    if (this.started && obj.dispose) {
      await obj.dispose()
    }
  }
}

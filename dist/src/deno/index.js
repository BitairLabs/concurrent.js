var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// libs/platform/src/deno/worker.ts
var DenoWorker = class {
  _worker;
  messageHandler;
  errorHandler;
  constructor(scriptSrc) {
    this._worker = new Worker(new URL(scriptSrc).href, { type: "module" });
    this._worker.onmessage = (e) => {
      if (this.messageHandler)
        this.messageHandler(e.data);
    };
    this._worker.onerror = (error) => {
      if (this.errorHandler)
        this.errorHandler(error.error);
    };
  }
  postMessage(message) {
    this._worker.postMessage(message);
  }
  onmessage(handler) {
    this.messageHandler = handler;
  }
  onerror(handler) {
    this.errorHandler = handler;
  }
  terminate() {
    this._worker.terminate();
  }
};

// libs/platform/src/core/constants.ts
var ErrorMessage = {
  InternalError: { code: 500, text: "Internal error has occurred." },
  DisposeOverridden: { code: 501, text: "'dispose' method will be overridden." },
  InvalidMessageType: { code: 502, text: "Can't handle a message with the type '%{1}'." },
  InvalidTaskType: { code: 503, text: "Can't handle a task with the type '%{1}'" },
  CoroutineNotFound: { code: 504, text: "Couldn't find a coroutine with the ID '%{1}'." },
  ObjectNotFound: { code: 505, text: "Couldn't find an object with the ID '%{1}'" },
  NotRunningOnWorker: { code: 506, text: "This module must be run on a worker." },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 509, text: "Thread allocation failed due to timeout." }
};

// libs/platform/src/core/utils.ts
function isFunction(val) {
  return typeof val === "function";
}
function format(str, ...params) {
  for (let i = 1; i <= params.length; i++) {
    str = str.replace(`%{${i}}`, () => params[i]);
  }
  return str;
}
function getNumber(val) {
  if (val === Infinity)
    return val;
  const parsed = parseFloat(val);
  return !Number.isNaN(parsed) ? parsed : void 0;
}
function getBoolean(val) {
  return val === false || val === true ? val : void 0;
}

// libs/platform/src/core/error.ts
var ConcurrencyError = class extends Error {
  code;
  constructor({ code, text }, ...params) {
    super(format(`Concurrent.js Error: ${text}`, ...params));
    this.code = code;
  }
};

// libs/platform/src/core/task.ts
var Task = class {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
  static instantiateObject(moduleSrc, ctorName, ctorArgs) {
    const data = [moduleSrc, ctorName, ctorArgs];
    return new Task(0 /* InstantiateObject */, data);
  }
  static invokeMethod(objectId, methodName, args) {
    const data = [objectId, methodName, args];
    return new Task(1 /* InvokeMethod */, data);
  }
  static disposeObject(objectId) {
    const data = [objectId];
    return new Task(2 /* DisposeObject */, data);
  }
  static invokeFunction(moduleSrc, functionName, args) {
    const data = [moduleSrc, functionName, args];
    return new Task(3 /* InvokeFunction */, data);
  }
};

// libs/platform/src/core/threaded_object.ts
var FUNCTION = "function";
var CONSTRUCTOR = "constructor";
var DISPOSE = "dispose";
var ThreadedObject = class {
  constructor(pool, moduleSrc, exportName, ctor, ctorArgs, execSettings) {
    this.pool = pool;
    this.moduleSrc = moduleSrc;
    this.exportName = exportName;
    this.ctorArgs = ctorArgs;
    this.execSettings = execSettings;
    const _this = this;
    const prototype = ctor.prototype;
    for (const property of Object.getOwnPropertyNames(prototype)) {
      if (property === DISPOSE)
        throw new ConcurrencyError(ErrorMessage.DisposeOverridden);
      if (typeof prototype[property] === FUNCTION && property !== CONSTRUCTOR) {
        const methodName = property;
        this.proxy[methodName] = async function invoke(...params) {
          return _this.invoke.call(_this, methodName, params);
        };
      }
    }
    this.proxy[DISPOSE] = async () => await this.dispose();
  }
  thread;
  id;
  instantiated = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  proxy = {};
  async invoke(methodName, args) {
    if (!this.instantiated) {
      await this.instantiate();
      this.instantiated = true;
    }
    const thread = this.thread;
    const task = Task.invokeMethod(this.id, methodName, args);
    return await thread.run(task);
  }
  async instantiate() {
    const thread = this.thread = await this.pool.getThread(this.execSettings.parallel);
    const ctorName = this.exportName;
    const task = Task.instantiateObject(this.moduleSrc, ctorName, this.ctorArgs);
    this.id = await thread.run(task);
    this.pool.registerObject(this, this.id, this.thread);
    return this.id;
  }
  async dispose() {
    this.pool.unregisterObject(this);
    this.pool.disposeObject(this.id, this.thread);
  }
};

// libs/platform/src/core/threaded_function.ts
var ThreadedFunction = class {
  constructor(pool, moduleSrc, exportName, execSettings) {
    this.pool = pool;
    this.moduleSrc = moduleSrc;
    this.exportName = exportName;
    this.execSettings = execSettings;
    const _this = this;
    this.proxy = {
      async invoke(args) {
        return _this.invoke.call(_this, args);
      }
    };
  }
  _thread;
  proxy;
  async thread() {
    if (!this._thread) {
      const thread = await this.pool.getThread(this.execSettings.parallel);
      this._thread = thread;
    }
    return this._thread;
  }
  async invoke(args) {
    const thread = await this.thread();
    const task = Task.invokeFunction(this.moduleSrc, this.exportName, args);
    return await thread.run(task);
  }
};

// libs/platform/src/core/module_loader.ts
var ModuleLoader = class {
  constructor(pool) {
    this.pool = pool;
  }
  async load(moduleSrc, execSettings) {
    const exports = await import(moduleSrc);
    const proxy = {};
    for (const exportName in exports) {
      if (Object.prototype.hasOwnProperty.call(exports, exportName)) {
        const _export = exports[exportName];
        if (isFunction(_export)) {
          proxy[exportName] = this.createProxy(moduleSrc, exportName, _export, execSettings);
        } else {
          proxy[exportName] = _export;
        }
      }
    }
    return proxy;
  }
  createProxy(moduleSrc, exportName, ctor, execSettings) {
    const pool = this.pool;
    return function ExportProxy(...params) {
      if (new.target) {
        const obj = new ThreadedObject(pool, moduleSrc, exportName, ctor, params, execSettings);
        return obj.proxy;
      } else {
        const fn = new ThreadedFunction(pool, moduleSrc, exportName, execSettings);
        return fn.proxy.invoke(params);
      }
    };
  }
};

// libs/platform/src/core/coroutine.ts
var _Coroutine = class {
  constructor(id, callback) {
    this.id = id;
    this.callback = callback;
  }
  static create(callback) {
    this.lastCoroutineId += 1;
    return new _Coroutine(this.lastCoroutineId, callback);
  }
  done(error, result) {
    this.callback(error, result);
  }
};
var Coroutine = _Coroutine;
__publicField(Coroutine, "lastCoroutineId", 0);

// libs/platform/src/core/thread.ts
var Thread = class {
  constructor(workerFactory) {
    this.workerFactory = workerFactory;
    this.worker = workerFactory.create();
    this.initWorker();
  }
  coroutines = /* @__PURE__ */ new Map();
  worker;
  locked = false;
  async run(task) {
    return new Promise((resolve, reject) => {
      const coroutine = Coroutine.create((error, result) => {
        this.coroutines.delete(coroutine.id);
        if (error)
          return reject(error);
        return resolve(result);
      });
      const taskInfo = [coroutine.id, task.type, task.data];
      this.coroutines.set(coroutine.id, coroutine);
      const message = [0 /* RunTask */, taskInfo];
      this.postMessage(message);
    });
  }
  initWorker() {
    this.worker.onmessage((message) => {
      this.handleMessage(message);
    });
    this.worker.onerror((error) => {
      for (const coroutine of this.coroutines.values()) {
        coroutine.done(new ConcurrencyError(ErrorMessage.InternalError), void 0);
      }
      this.worker = this.workerFactory.create();
      throw error;
    });
  }
  async terminate(force) {
    if (!force) {
      this.coroutines.clear();
      this.worker.terminate();
    } else {
      this.terminate(force);
    }
  }
  postMessage(message) {
    this.worker.postMessage(message);
  }
  handleMessage([type, data]) {
    if (type === 1 /* ReadTaskResult */) {
      const [coroutineId, error, result] = data;
      const coroutine = this.coroutines.get(coroutineId);
      if (!coroutine)
        throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId);
      coroutine.done(error, result);
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidMessageType, type);
    }
  }
};

// libs/platform/src/core/thread_pool.ts
var ThreadPool = class {
  constructor(workerFactory, settings) {
    this.workerFactory = workerFactory;
    this.settings = settings;
    if (this.settings.minThreads) {
      for (let i = 0; i < this.settings.minThreads; i++) {
        this.addThread();
      }
    }
    this.objectRegistry = new FinalizationRegistry(({ id, threadRef }) => {
      const thread = threadRef.deref();
      if (thread)
        this.disposeObject(id, thread);
    });
    this.timer = setInterval(() => {
      this.allocate();
    });
  }
  turn = 0;
  threads = [];
  requests = /* @__PURE__ */ new Set();
  totalThreads = 0;
  timer;
  objectRegistry;
  config(settings) {
    Object.assign(this.settings, settings);
  }
  async getThread(exclusive) {
    if (this.totalThreads < this.settings.maxThreads)
      this.addThread();
    const thread = await new Promise((resolve, reject) => {
      const callback = (thread2, error) => {
        if (error)
          reject(error);
        else
          resolve(thread2);
      };
      this.requests.add({ time: performance.now(), exclusive, callback });
    });
    return thread;
  }
  registerObject(object, id, thread) {
    this.objectRegistry.register(
      object,
      {
        id,
        threadRef: new WeakRef(thread)
      },
      object
    );
  }
  unregisterObject(object) {
    this.objectRegistry.unregister(object);
  }
  async disposeObject(id, thread) {
    const task = Task.disposeObject(id);
    await thread.run(task);
    if (thread.locked)
      thread.locked = false;
  }
  async descale(force) {
    for (const thread of this.threads) {
      if (this.threads.length <= this.settings.minThreads)
        break;
      await thread.terminate(force);
      this.threads.pop();
      this.totalThreads -= 1;
    }
  }
  async terminate(force) {
    for (let i = 0; i < this.threads.length; i++) {
      const thread = this.threads[i];
      await thread.terminate(force);
    }
    clearInterval(this.timer);
  }
  allocate() {
    for (const request of this.requests) {
      const { callback, exclusive, time } = request;
      const timeout = this.settings.threadAllocationTimeout;
      if (timeout !== Infinity && performance.now() > time + timeout) {
        this.requests.delete(request);
        callback(void 0, new ConcurrencyError(ErrorMessage.ThreadAllocationTimeout));
      } else {
        const thread = this.selectThread(exclusive);
        if (thread) {
          this.requests.delete(request);
          callback(thread);
        }
      }
    }
  }
  addThread() {
    const thread = new Thread(this.workerFactory);
    this.threads.push(thread);
    this.totalThreads += 1;
  }
  selectThread(exclusive) {
    if (this.turn > this.threads.length - 1)
      this.turn = 0;
    let thread;
    for (let i = this.turn; i < this.threads.length; i++) {
      const _thread = this.threads[i];
      if (!_thread.locked) {
        thread = _thread;
        break;
      }
      this.turn += 1;
    }
    if (thread && exclusive)
      thread.locked = true;
    return thread;
  }
};

// libs/platform/src/core/master.ts
var Master = class {
  constructor(workerFactory) {
    this.workerFactory = workerFactory;
    this.settings = {
      disabled: false,
      maxThreads: 1,
      minThreads: 0,
      threadAllocationTimeout: Infinity,
      threadIdleTimeout: Infinity
    };
  }
  settings;
  moduleLoader;
  pool;
  started = false;
  config(settings) {
    settings = settings ?? {};
    this.settings = {
      disabled: getBoolean(settings.disabled) ?? this.settings.disabled,
      maxThreads: getNumber(settings.maxThreads) || this.settings.maxThreads,
      minThreads: getNumber(settings.minThreads) ?? this.settings.minThreads,
      threadAllocationTimeout: getNumber(settings.threadAllocationTimeout) || this.settings.threadAllocationTimeout,
      threadIdleTimeout: getNumber(settings.threadIdleTimeout) || this.settings.threadIdleTimeout
    };
    if (this.started)
      this.pool.config(this.settings);
  }
  async load(moduleSrc, _settings) {
    moduleSrc = moduleSrc.toString();
    if (!this.settings.disabled && !this.started)
      this.start();
    _settings = _settings ?? {};
    const settings = {
      parallel: getBoolean(_settings?.parallel) ?? false,
      timeout: getNumber(_settings.timeout) || Infinity
    };
    return this.settings.disabled ? await import(moduleSrc) : this.moduleLoader.load(moduleSrc, settings);
  }
  async descale(force) {
    await this.pool?.descale(!!force);
  }
  async start() {
    if (!this.started) {
      this.pool = new ThreadPool(this.workerFactory, this.settings);
      this.moduleLoader = new ModuleLoader(this.pool);
      this.started = true;
    }
  }
  async terminate(force) {
    if (this.started) {
      await this.pool.terminate(!!force);
      this.moduleLoader = void 0;
      this.pool = void 0;
      this.started = false;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async dispose(obj) {
    if (this.started && obj.dispose) {
      await obj.dispose();
    }
  }
};

// libs/platform/src/deno/index.ts
var master = new Master({
  create: () => {
    const BASE_URL = Deno.env.get("BASE_URL");
    const src = new URL("./worker_script.js", BASE_URL ? new URL(BASE_URL) : import.meta.url);
    return new DenoWorker(src);
  }
});
var deno_default = master;
export {
  deno_default as default
};

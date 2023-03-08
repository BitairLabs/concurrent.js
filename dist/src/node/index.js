var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// libs/platform/src/node/worker.ts
import { Worker } from "worker_threads";
var NodeWorker = class {
  _worker;
  messageHandler;
  errorHandler;
  constructor(scriptSrc) {
    this._worker = new Worker(scriptSrc);
    this._worker.on("message", (message) => {
      if (this.messageHandler)
        this.messageHandler(message);
    });
    this._worker.on("error", (error) => {
      if (this.errorHandler)
        this.errorHandler(error);
    });
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
  InvalidMessageType: { code: 502, text: "Can't handle a message with the type '%{0}'." },
  InvalidTaskType: { code: 503, text: "Can't handle a task with the type '%{0}'" },
  CoroutineNotFound: { code: 504, text: "Couldn't find a coroutine with the ID '%{0}'." },
  ObjectNotFound: { code: 505, text: "Couldn't find an object with the ID '%{0}'" },
  NotRunningOnWorker: { code: 506, text: "This module must be run on a worker." },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 508, text: "Thread allocation failed due to timeout." },
  MethodAssignment: { code: 509, text: "Can't assign a method." },
  NonFunctionLoad: { code: 510, text: "Can't load an export of type '%{0}'." }
};
var SYMBOL = {
  DISPOSE: Symbol("DISPOSE")
};

// libs/platform/src/core/utils.ts
function isFunction(val) {
  return typeof val === "function";
}
function format(str, args) {
  for (let i = 0; i < args.length; i++) {
    str = str.replace(`%{${i}}`, args[i]);
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
    const message = format(`Concurrent.js Error: ${text}`, params);
    super(message);
    this.code = code;
  }
};

// libs/platform/src/core/task.ts
var Task = class {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
  static invokeFunction(moduleSrc, functionName, args) {
    const data = [moduleSrc, functionName, args];
    return new Task(1 /* InvokeFunction */, data);
  }
  static getStaticProperty(moduleSrc, exportName, propName) {
    const data = [moduleSrc, exportName, propName];
    return new Task(2 /* GetStaticProperty */, data);
  }
  static setStaticProperty(moduleSrc, exportName, propName, value) {
    const data = [moduleSrc, exportName, propName, value];
    return new Task(3 /* SetStaticProperty */, data);
  }
  static invokeStaticMethod(moduleSrc, exportName, methodName, args) {
    const data = [moduleSrc, exportName, methodName, args];
    return new Task(4 /* InvokeStaticMethod */, data);
  }
  static instantiateObject(moduleSrc, exportName, ctorArgs) {
    const data = [moduleSrc, exportName, ctorArgs];
    return new Task(5 /* InstantiateObject */, data);
  }
  static getInstanceProperty(objectId, propName) {
    const data = [objectId, propName];
    return new Task(6 /* GetInstanceProperty */, data);
  }
  static setInstanceProperty(objectId, propName, value) {
    const data = [objectId, propName, value];
    return new Task(7 /* SetInstanceProperty */, data);
  }
  static invokeInstanceMethod(objectId, methodName, args) {
    const data = [objectId, methodName, args];
    return new Task(8 /* InvokeInstanceMethod */, data);
  }
  static disposeObject(objectId) {
    const data = [objectId];
    return new Task(9 /* DisposeObject */, data);
  }
};

// libs/platform/src/core/threaded_function.ts
var ThreadedFunction = class {
  constructor(pool, moduleSrc, exportName, execSettings) {
    this.pool = pool;
    this.moduleSrc = moduleSrc;
    this.exportName = exportName;
    this.execSettings = execSettings;
  }
  async invoke(args) {
    const thread = await this.pool.getThread(this.execSettings.parallel);
    const task = Task.invokeFunction(this.moduleSrc, this.exportName, args);
    const result = await thread.run(task);
    if (this.execSettings.parallel)
      this.pool.releaseThread(thread);
    return result;
  }
  async getStaticProperty(propName) {
    const thread = await this.pool.getThread(this.execSettings.parallel);
    const task = Task.getStaticProperty(this.moduleSrc, this.exportName, propName);
    const result = await thread.run(task);
    if (this.execSettings.parallel)
      this.pool.releaseThread(thread);
    return result;
  }
  async setStaticProperty(propName, value) {
    const thread = await this.pool.getThread(this.execSettings.parallel);
    const task = Task.setStaticProperty(this.moduleSrc, this.exportName, propName, value);
    const result = await thread.run(task);
    if (this.execSettings.parallel)
      this.pool.releaseThread(thread);
    return result;
  }
  async invokeStaticMethod(methodName, args) {
    const thread = await this.pool.getThread(this.execSettings.parallel);
    const task = Task.invokeStaticMethod(this.moduleSrc, this.exportName, methodName, args);
    const result = await thread.run(task);
    if (this.execSettings.parallel)
      this.pool.releaseThread(thread);
    return result;
  }
};

// libs/platform/src/core/threaded_object.ts
var ThreadedObject = class {
  constructor(pool, thread, id, properties) {
    this.pool = pool;
    this.thread = thread;
    this.id = id;
    this.properties = properties;
  }
  static async create(pool, moduleSrc, exportName, ctorArgs, execSettings) {
    const thread = await pool.getThread(execSettings.parallel);
    const task = Task.instantiateObject(moduleSrc, exportName, ctorArgs);
    const [id, properties] = await thread.run(task);
    const obj = new ThreadedObject(pool, thread, id, properties);
    pool.registerObject(obj, id, thread);
    return obj;
  }
  async getProperty(propName) {
    const task = Task.getInstanceProperty(this.id, propName);
    return await this.thread.run(task);
  }
  async setProperty(propName, value) {
    const task = Task.setInstanceProperty(this.id, propName, value);
    return await this.thread.run(task);
  }
  async invoke(methodName, args) {
    const task = Task.invokeInstanceMethod(this.id, methodName, args);
    return await this.thread.run(task);
  }
  async dispose() {
    this.pool.unregisterObject(this);
    this.pool.disposeObject(this.id, this.thread);
  }
};

// libs/platform/src/core/module_loader.ts
var ModuleLoader = class {
  constructor(pool) {
    this.pool = pool;
  }
  async load(moduleSrc, execSettings) {
    const pool = this.pool;
    const module = await import(moduleSrc);
    return new Proxy(module, {
      get(module2, exportName) {
        if (!Reflect.has(module2, exportName))
          return;
        const _export = Reflect.get(module2, exportName);
        if (!isFunction(_export))
          throw new ConcurrencyError(ErrorMessage.NonFunctionLoad);
        return createFunctionProxy(pool, moduleSrc, _export, execSettings);
      }
    });
  }
};
function createFunctionProxy(pool, moduleSrc, target, execSettings) {
  const threadedFunction = new ThreadedFunction(pool, moduleSrc, target.name, execSettings);
  return new Proxy(target, {
    get(target2, key) {
      if (!Reflect.has(target2, key))
        return;
      const prop = Reflect.get(target2, key);
      if (prop instanceof Promise)
        return prop;
      if (!isFunction(prop))
        return threadedFunction.getStaticProperty(key);
      else
        return (...params) => threadedFunction.invokeStaticMethod(key, params);
    },
    set(target2, key, value) {
      if (!Reflect.has(target2, key))
        return false;
      const prop = Reflect.get(target2, key);
      if (isFunction(prop))
        throw new ConcurrencyError(ErrorMessage.MethodAssignment);
      const setter = new Promise((resolve, reject) => {
        threadedFunction.setStaticProperty(key, value).then(() => {
          Reflect.set(target2, key, void 0);
          resolve(value);
        }).catch((error) => reject(error));
      });
      Reflect.set(target2, key, setter);
      return true;
    },
    construct(target2, args) {
      return createObjectProxy(pool, moduleSrc, target2.name, args, execSettings);
    },
    apply(_target, _thisArg, args) {
      return threadedFunction.invoke(args);
    }
  });
}
async function createObjectProxy(pool, moduleSrc, exportName, args, execSettings) {
  const threadedObject = await ThreadedObject.create(pool, moduleSrc, exportName, args, execSettings);
  return new Proxy(threadedObject.properties, {
    get(target, key) {
      if (key === SYMBOL.DISPOSE)
        return threadedObject.dispose.bind(threadedObject);
      if (!Reflect.has(target, key))
        return;
      const prop = Reflect.get(target, key);
      if (prop instanceof Promise)
        return prop;
      if (threadedObject.properties[key] === "function" /* Function */) {
        return (...params) => threadedObject.invoke(key, params);
      } else {
        return threadedObject.getProperty(key);
      }
    },
    set(target, key, value) {
      if (!Reflect.has(target, key))
        return false;
      if (threadedObject.properties[key] === "function" /* Function */)
        throw new ConcurrencyError(ErrorMessage.MethodAssignment);
      const setter = new Promise((resolve, reject) => {
        threadedObject.setProperty(key, value).then(() => {
          Reflect.set(target, key, "undefined" /* Undefined */);
          resolve(value);
        }).catch((error) => reject(error));
      });
      Reflect.set(target, key, setter);
      return true;
    }
  });
}

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
      const message = [1 /* RunTask */, taskInfo];
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
    if (type === 2 /* ReadTaskResult */) {
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
  async getThread(exclusive = false) {
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
  releaseThread(thread) {
    thread.locked = false;
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
    const dispose = Reflect.get(obj, SYMBOL.DISPOSE);
    if (this.started && dispose) {
      await dispose();
    }
  }
};

// libs/platform/src/node/index.ts
var concurrent = new Master({
  create: () => {
    const BASE_URL = process.env["BASE_URL"];
    const src = new URL("./worker_script.js", BASE_URL ? new URL(BASE_URL) : import.meta.url);
    return new NodeWorker(src);
  }
});
export {
  concurrent
};

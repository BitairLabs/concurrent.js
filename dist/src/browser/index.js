var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// libs/platform/src/core/constants.ts
var constants_exports = {};
__export(constants_exports, {
  ErrorMessage: () => ErrorMessage,
  TaskType: () => TaskType,
  ThreadMessageType: () => ThreadMessageType,
  ValueType: () => ValueType,
  defaultConcurrencySettings: () => defaultConcurrencySettings,
  defaultThreadPoolSettings: () => defaultThreadPoolSettings
});
var ThreadMessageType = /* @__PURE__ */ ((ThreadMessageType2) => {
  ThreadMessageType2[ThreadMessageType2["Task"] = 1] = "Task";
  ThreadMessageType2[ThreadMessageType2["DirectMessage"] = 2] = "DirectMessage";
  ThreadMessageType2[ThreadMessageType2["DirectMessageReplied"] = 3] = "DirectMessageReplied";
  ThreadMessageType2[ThreadMessageType2["TaskCompleted"] = 4] = "TaskCompleted";
  return ThreadMessageType2;
})(ThreadMessageType || {});
var TaskType = /* @__PURE__ */ ((TaskType3) => {
  TaskType3[TaskType3["InvokeFunction"] = 1] = "InvokeFunction";
  TaskType3[TaskType3["GetStaticProperty"] = 2] = "GetStaticProperty";
  TaskType3[TaskType3["SetStaticProperty"] = 3] = "SetStaticProperty";
  TaskType3[TaskType3["InvokeStaticMethod"] = 4] = "InvokeStaticMethod";
  TaskType3[TaskType3["InstantiateObject"] = 5] = "InstantiateObject";
  TaskType3[TaskType3["GetInstanceProperty"] = 6] = "GetInstanceProperty";
  TaskType3[TaskType3["SetInstanceProperty"] = 7] = "SetInstanceProperty";
  TaskType3[TaskType3["InvokeInstanceMethod"] = 8] = "InvokeInstanceMethod";
  TaskType3[TaskType3["DisposeObject"] = 9] = "DisposeObject";
  return TaskType3;
})(TaskType || {});
var ErrorMessage = {
  InternalError: { code: 500, text: "Internal error has occurred." },
  InvalidThreadMessageType: { code: 502, text: "Cannot handle a thread message with the type '%{0}'." },
  InvalidTaskType: { code: 503, text: "Cannot handle a task with the type '%{0}'" },
  CoroutineNotFound: { code: 504, text: "Cannot find a coroutine with the ID '%{0}'." },
  ObjectNotFound: { code: 505, text: "Cannot find an object with the ID '%{0}'" },
  NotRunningOnWorker: { code: 506, text: "This module must be run on a worker." },
  WorkerNotSupported: { code: 507, text: "This browser doesn't support web workers." },
  ThreadAllocationTimeout: { code: 508, text: "Thread allocation failed due to timeout." },
  MethodAssignment: { code: 509, text: "Cannot assign a method." },
  NotAccessibleExport: {
    code: 510,
    text: "Cannot access an export of type '%{0}'. Only top level functions and classes are imported."
  },
  ThreadPoolTerminated: { code: 511, text: "Thread pool has been terminated." },
  ThreadTerminated: { code: 512, text: "Thread has been terminated." },
  UnrecognizedModuleType: {
    code: 513,
    text: "A module with an unrecognized type has been passed '%{0}'."
  },
  UnexportedFunction: {
    code: 514,
    text: "No function with the name '%{0}' has been exported in module '{%1}'."
  },
  TooManyChannelProvided: {
    code: 515,
    text: "More than one channel has been provided for the task."
  },
  UsedChannelProvided: {
    code: 516,
    text: "The provided channel has already been used for another task."
  },
  ChannelNotFound: {
    code: 517,
    text: "Cannot find a channel for a coroutine with the ID '{%1}'"
  },
  MessageNotFound: {
    code: 518,
    text: "Cannot find a message with the ID '{%1}'"
  }
};
var ValueType = {
  undefined: 1,
  boolean: 2,
  number: 3,
  bigint: 4,
  string: 5,
  symbol: 6,
  function: 7,
  object: 8
};
var defaultThreadPoolSettings = {
  maxThreads: 1,
  minThreads: 0,
  threadIdleTimeout: Infinity
};
var defaultConcurrencySettings = Object.assign(
  {
    disabled: false
  },
  defaultThreadPoolSettings
);

// libs/platform/src/core/utils.ts
function isBoolean(val) {
  return typeof val === "boolean";
}
function isNumber(val) {
  return typeof val === "number";
}
function isString(val) {
  return typeof val === "string";
}
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
  val = isString(val) ? val.indexOf(".") !== -1 ? parseFloat(val) : parseInt(val) : val;
  return !isNumber(val) || Number.isNaN(val) ? void 0 : val;
}
function getBoolean(val) {
  return !isBoolean(val) ? void 0 : val;
}
function createObject(properties) {
  const obj = {};
  for (const key in properties) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      const type = properties[key];
      const defaultValue = (() => {
        switch (type) {
          case 2:
            return false;
          case 3:
            return 0;
          case 4:
            return BigInt("0");
          case 5:
            return "";
          case 6:
            return Symbol();
          case 7:
            return new Function();
          case 8:
            return new Object();
          default:
            return void 0;
        }
      })();
      Reflect.set(obj, key, defaultValue);
    }
  }
  return obj;
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

// libs/platform/src/core/message.ts
var _Message = class {
  constructor(id, replyCallback) {
    this.id = id;
    this.replyCallback = replyCallback;
  }
  static create(replyCallback) {
    this.lastMessageId += 1;
    return new _Message(this.lastMessageId, replyCallback);
  }
  reply(error, result) {
    this.replyCallback(error, result);
  }
};
var Message = _Message;
__publicField(Message, "lastMessageId", 0);

// libs/platform/src/core/channel.ts
var Channel = class {
  worker;
  coroutineId;
  messages;
  messageHandler;
  initialized = false;
  constructor(listener) {
    this.messages = /* @__PURE__ */ new Map();
    listener(this.onmessage.bind(this), this.postMessage.bind(this));
  }
  init(worker, coroutineId) {
    this.initialized = true;
    this.worker = worker;
    this.coroutineId = coroutineId;
  }
  onmessage(handler) {
    this.messageHandler = handler;
  }
  postMessage(name, ...data) {
    return new Promise((resolve, reject) => {
      const message = Message.create((error, result) => {
        if (error)
          return reject(error);
        return resolve(result);
      });
      this.messages.set(message.id, message);
      this.worker?.postMessage([
        2 /* DirectMessage */,
        [this.coroutineId, [message.id, name, data]]
      ]);
    });
  }
  async handleMessage(name, data) {
    if (this.messageHandler)
      return await this.messageHandler(name, ...data);
  }
  async handleMessageReply([messageId, error, result]) {
    const message = this.messages.get(messageId);
    if (!message)
      throw new ConcurrencyError(ErrorMessage.MessageNotFound, messageId);
    await message.reply(error, result);
    this.messages.delete(messageId);
  }
};

// libs/platform/src/core/task.ts
var Task = class {
  constructor(type, data) {
    this.type = type;
    this.data = data;
    if (!TaskType[type])
      throw new ConcurrencyError(ErrorMessage.InvalidTaskType, type);
  }
};

// libs/platform/src/core/threaded_function.ts
var ThreadedFunction = class {
  constructor(thread, moduleSrc, exportName) {
    this.thread = thread;
    this.moduleSrc = moduleSrc;
    this.exportName = exportName;
  }
  async invoke(args) {
    const task = new Task(1 /* InvokeFunction */, [this.moduleSrc, this.exportName, args]);
    const result = await this.thread.run(task);
    return result;
  }
  async getStaticProperty(propName) {
    const task = new Task(2 /* GetStaticProperty */, [
      this.moduleSrc,
      this.exportName,
      propName
    ]);
    const result = await this.thread.run(task);
    return result;
  }
  async setStaticProperty(propName, value) {
    const task = new Task(3 /* SetStaticProperty */, [
      this.moduleSrc,
      this.exportName,
      propName,
      value
    ]);
    const result = await this.thread.run(task);
    return result;
  }
  async invokeStaticMethod(methodName, args) {
    const task = new Task(4 /* InvokeStaticMethod */, [
      this.moduleSrc,
      this.exportName,
      methodName,
      args
    ]);
    const result = await this.thread.run(task);
    return result;
  }
};

// libs/platform/src/core/threaded_object.ts
var _ThreadedObject = class {
  constructor(thread, id, target) {
    this.thread = thread;
    this.id = id;
    this.target = target;
  }
  static async create(thread, moduleSrc, exportName, ctorArgs) {
    const task = new Task(5 /* InstantiateObject */, [moduleSrc, exportName, ctorArgs]);
    const [id, properties] = await thread.run(task);
    const obj = new _ThreadedObject(thread, id, createObject(properties));
    this.objectRegistry.register(obj, { id, threadRef: new WeakRef(thread) }, obj);
    return obj;
  }
  async getProperty(propName) {
    const task = new Task(6 /* GetInstanceProperty */, [this.id, propName]);
    const result = await this.thread.run(task);
    return result;
  }
  async setProperty(propName, value) {
    const task = new Task(7 /* SetInstanceProperty */, [this.id, propName, value]);
    const result = await this.thread.run(task);
    return result;
  }
  async invoke(methodName, args) {
    const task = new Task(8 /* InvokeInstanceMethod */, [this.id, methodName, args]);
    const result = await this.thread.run(task);
    return result;
  }
};
var ThreadedObject = _ThreadedObject;
__publicField(ThreadedObject, "objectRegistry", new FinalizationRegistry(({ id, threadRef }) => {
  const thread = threadRef.deref();
  if (thread) {
    const task = new Task(9 /* DisposeObject */, [id]);
    thread.run(task).finally();
  }
}));

// libs/platform/src/core/concurrent_module.ts
var ConcurrentModule = class {
  constructor(pool, src) {
    this.pool = pool;
    this.src = src;
  }
  async load() {
    const moduleSrc = this.src.toString();
    const module = await import(moduleSrc);
    const thread = await this.pool.getThread();
    const cache = {};
    return new Proxy(module, {
      get(obj, key) {
        const _export = Reflect.get(obj, key);
        if (key === "then")
          return;
        else if (!Reflect.has(obj, key))
          return;
        else if (!isFunction(_export))
          throw new ConcurrencyError(ErrorMessage.NotAccessibleExport);
        else {
          if (!Reflect.has(cache, key))
            Reflect.set(cache, key, createThreadedFunction(thread, moduleSrc, _export));
          return Reflect.get(cache, key);
        }
      }
    });
  }
};
function createThreadedFunction(thread, moduleSrc, target) {
  const threadedFunction = new ThreadedFunction(thread, moduleSrc, target.name);
  return new Proxy(target, {
    get(target2, key) {
      const prop = Reflect.get(target2, key);
      if (!Reflect.has(target2, key))
        return;
      else if (prop instanceof AsyncSetter)
        return prop.wait();
      else if (!isFunction(prop))
        return threadedFunction.getStaticProperty(key);
      else
        return (...params) => threadedFunction.invokeStaticMethod(key, params);
    },
    set(target2, key, value) {
      const prop = Reflect.get(target2, key);
      if (!Reflect.has(target2, key))
        return false;
      else if (isFunction(prop))
        throw new ConcurrencyError(ErrorMessage.MethodAssignment);
      else {
        const setter = new AsyncSetter(
          () => threadedFunction.setStaticProperty(key, value).then(() => {
            Reflect.set(target2, key, void 0);
          })
        );
        Reflect.set(target2, key, setter);
        return true;
      }
    },
    construct(target2, args) {
      return createThreadedObject(thread, moduleSrc, target2.name, args);
    },
    apply(_target, _thisArg, args) {
      return threadedFunction.invoke(args);
    }
  });
}
async function createThreadedObject(thread, moduleSrc, exportName, args) {
  const threadedObject = await ThreadedObject.create(thread, moduleSrc, exportName, args);
  return new Proxy(threadedObject.target, {
    get(target, key) {
      const prop = Reflect.get(target, key);
      if (!Reflect.has(target, key))
        return;
      else if (prop instanceof AsyncSetter)
        return prop.wait();
      else if (isFunction(prop))
        return (...params) => threadedObject.invoke(key, params);
      else
        return threadedObject.getProperty(key);
    },
    set(target, key, value) {
      const prop = Reflect.get(target, key);
      if (!Reflect.has(target, key))
        return false;
      else if (isFunction(prop))
        throw new ConcurrencyError(ErrorMessage.MethodAssignment);
      else {
        const setter = new AsyncSetter(
          () => threadedObject.setProperty(key, value).then(() => {
            Reflect.set(target, key, void 0);
          })
        );
        Reflect.set(target, key, setter);
        return true;
      }
    }
  });
}
var AsyncSetter = class {
  constructor(setter) {
    this.setter = setter;
  }
  wait() {
    return this.setter();
  }
};

// libs/platform/src/core/common.ts
function isInvocableTask(type) {
  return [1 /* InvokeFunction */, 4 /* InvokeStaticMethod */, 8 /* InvokeInstanceMethod */].includes(type);
}
function getChannelFlagIndex(type) {
  return type === 4 /* InvokeStaticMethod */ ? 4 : 3;
}
function getTaskArgs(type, data) {
  const argsIndex = type === 4 /* InvokeStaticMethod */ ? 3 : 2;
  return data[argsIndex];
}

// libs/platform/src/core/coroutine.ts
var _Coroutine = class {
  constructor(id, callback, channel) {
    this.id = id;
    this.callback = callback;
    this.channel = channel;
  }
  static create(callback, channel) {
    this.lastCoroutineId += 1;
    return new _Coroutine(this.lastCoroutineId, callback, channel);
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
  terminated = false;
  async run(task) {
    if (this.terminated)
      throw new ConcurrencyError(ErrorMessage.ThreadTerminated);
    const result = new Promise((resolve, reject) => {
      const channel = isInvocableTask(task.type) ? this.prepareChannelIfAny(task.type, task.data) : void 0;
      const coroutine = Coroutine.create((error, result2) => {
        this.coroutines.delete(coroutine.id);
        if (error)
          reject(error);
        else
          resolve(result2);
      }, channel);
      if (channel)
        channel.init(this.worker, coroutine.id);
      const taskInfo = [coroutine.id, task.type, task.data];
      this.coroutines.set(coroutine.id, coroutine);
      this.worker.postMessage([1 /* Task */, taskInfo]);
    });
    return result;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async terminate(_force = false) {
    this.terminated = true;
    this.coroutines.clear();
    this.worker.terminate();
  }
  initWorker() {
    this.worker.onmessage(async (message) => {
      await this.handleMessage(message);
    });
    this.worker.onerror((error) => {
      for (const coroutine of this.coroutines.values()) {
        coroutine.done(new ConcurrencyError(ErrorMessage.InternalError), void 0);
      }
      this.worker = this.workerFactory.create();
      throw error;
    });
  }
  async handleMessage([type, data]) {
    if (type === 4 /* TaskCompleted */) {
      const [coroutineId, error, result] = data;
      const coroutine = this.coroutines.get(coroutineId);
      if (!coroutine)
        throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId);
      coroutine.done(error, result);
    } else if (type === 2 /* DirectMessage */) {
      const [coroutineId, message] = data;
      const coroutine = this.coroutines.get(coroutineId);
      if (!coroutine)
        throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId);
      if (coroutine.channel) {
        let result, error;
        try {
          result = await coroutine.channel.handleMessage(message[1], message[2]);
        } catch (err) {
          error = err;
        }
        this.worker.postMessage([
          3 /* DirectMessageReplied */,
          [coroutine.id, [message[0], error, result]]
        ]);
      }
    } else if (type === 3 /* DirectMessageReplied */) {
      const [coroutineId, reply] = data;
      const coroutine = this.coroutines.get(coroutineId);
      if (!coroutine)
        throw new ConcurrencyError(ErrorMessage.CoroutineNotFound, coroutineId);
      if (coroutine.channel) {
        await coroutine.channel.handleMessageReply(reply);
      }
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidThreadMessageType, type);
    }
  }
  prepareChannelIfAny(type, data) {
    let channel = void 0;
    const args = getTaskArgs(type, data);
    if (args.findIndex((arg) => arg instanceof Channel) > 1)
      throw new ConcurrencyError(ErrorMessage.TooManyChannelProvided);
    const channelArgIndex = args.findIndex((arg) => arg instanceof Channel);
    if (channelArgIndex >= 0) {
      channel = args[channelArgIndex];
      if (channel.initialized)
        throw new ConcurrencyError(ErrorMessage.UsedChannelProvided);
      args.splice(channelArgIndex);
      data[getChannelFlagIndex(type)] = true;
    }
    return channel;
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
  }
  turn = 0;
  threads = [];
  terminated = false;
  config(settings) {
    Object.assign(this.settings, settings);
  }
  async getThread() {
    if (this.terminated)
      throw new ConcurrencyError(ErrorMessage.ThreadPoolTerminated);
    if (this.threads.length < this.settings.maxThreads)
      this.addThread();
    if (this.turn > this.threads.length - 1)
      this.turn = 0;
    const thread = this.threads[this.turn];
    this.turn += 1;
    return thread;
  }
  async terminate(force = false) {
    for (let i = 0; i < this.threads.length; i++) {
      const thread = this.threads[i];
      await thread.terminate(force);
    }
    this.threads = [];
    this.terminated = true;
  }
  addThread() {
    const thread = new Thread(this.workerFactory);
    this.threads.push(thread);
  }
};

// libs/platform/src/core/master.ts
var Master = class {
  constructor(workerFactory) {
    this.workerFactory = workerFactory;
    this.settings = defaultConcurrencySettings;
  }
  settings;
  pool;
  started = false;
  config(settings) {
    settings = settings ?? {};
    this.settings = {
      disabled: getBoolean(settings.disabled) ?? this.settings.disabled,
      maxThreads: getNumber(settings.maxThreads) || this.settings.maxThreads,
      minThreads: getNumber(settings.minThreads) ?? this.settings.minThreads,
      threadIdleTimeout: getNumber(settings.threadIdleTimeout) || this.settings.threadIdleTimeout
    };
    if (this.started)
      this.pool.config(this.settings);
  }
  import(moduleSrc) {
    if (!this.settings.disabled && !this.started)
      this.start();
    const module = this.settings.disabled ? {
      load: () => import(moduleSrc.toString())
    } : new ConcurrentModule(this.pool, moduleSrc);
    return module;
  }
  async terminate(force) {
    if (this.started) {
      await this.pool.terminate(!!force);
      this.pool = void 0;
      this.started = false;
    }
  }
  start() {
    this.pool = new ThreadPool(this.workerFactory, this.settings);
    this.started = true;
  }
};

// libs/platform/src/core/worker_base.ts
var WorkerBase = class {
  constructor(_worker) {
    this._worker = _worker;
  }
  messageHandler;
  errorHandler;
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

// libs/platform/src/browser/worker.ts
var BrowserWorker = class extends WorkerBase {
  constructor(scriptSrc) {
    if (!window.Worker)
      throw new ConcurrencyError(constants_exports.ErrorMessage.WorkerNotSupported);
    const worker = new Worker(scriptSrc);
    super(worker);
    worker.onmessage = (e) => {
      if (this.messageHandler)
        this.messageHandler(e.data);
    };
    worker.onerror = (error) => {
      if (this.errorHandler)
        this.errorHandler(error.error);
    };
  }
};

// libs/platform/src/browser/index.ts
var concurrent = new Master({
  create: () => {
    const src = new URL("./worker_script.js", import.meta.url);
    return new BrowserWorker(src);
  }
});
export {
  Channel,
  concurrent
};

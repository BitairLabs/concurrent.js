var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// libs/platform/src/core/constants.ts
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
function isSymbol(val) {
  return typeof val === "symbol";
}
function format(str, args) {
  for (let i = 0; i < args.length; i++) {
    str = str.replace(`%{${i}}`, args[i]);
  }
  return str;
}
function getProperties(obj) {
  const map = {};
  while (obj) {
    const keys = Reflect.ownKeys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!isSymbol(key)) {
        if (!map[key]) {
          const descriptor = Reflect.getOwnPropertyDescriptor(obj, key);
          map[key] = Reflect.get(ValueType, typeof descriptor?.value);
        }
      }
    }
    obj = Reflect.getPrototypeOf(obj);
  }
  return map;
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

// libs/platform/src/core/task.ts
var Task = class {
  constructor(type, data) {
    this.type = type;
    this.data = data;
    if (!TaskType[type])
      throw new ConcurrencyError(ErrorMessage.InvalidTaskType, type);
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

// libs/platform/src/core/common.ts
function isInvocableTask(type) {
  return [1 /* InvokeFunction */, 4 /* InvokeStaticMethod */, 8 /* InvokeInstanceMethod */].includes(type);
}
function hasChannel(type, data) {
  return isInvocableTask(type) && data[getChannelFlagIndex(type)];
}
function getChannelFlagIndex(type) {
  return type === 4 /* InvokeStaticMethod */ ? 4 : 3;
}
function getTaskArgs(type, data) {
  const argsIndex = type === 4 /* InvokeStaticMethod */ ? 3 : 2;
  return data[argsIndex];
}

// libs/platform/src/core/worker_manager.ts
var WorkerManager = class {
  objects = /* @__PURE__ */ new Map();
  channels = /* @__PURE__ */ new Map();
  lastObjectId = 0;
  async handleMessage(type, data, worker) {
    let reply = null;
    if (type == 1 /* Task */) {
      const [coroutineId, taskType, taskData] = data;
      const [error, result] = await this.handleTask(coroutineId, taskType, taskData, worker);
      reply = [4 /* TaskCompleted */, [coroutineId, error, result]];
    } else if (type === 2 /* DirectMessage */) {
      const [coroutineId, message] = data;
      const [error, result] = await this.handleDirectMessage(coroutineId, message);
      reply = [
        3 /* DirectMessageReplied */,
        [coroutineId, [message[0], error, result]]
      ];
    } else if (type === 3 /* DirectMessageReplied */) {
      const [coroutineId, messageReply] = data;
      await this.handleDirectMessageReply(coroutineId, messageReply);
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidThreadMessageType, type);
    }
    return reply;
  }
  async handleTask(coroutineId, type, data, worker) {
    const channel = this.prepareChannelIfAny(type, data, worker, coroutineId);
    let error, result;
    switch (type) {
      case 1 /* InvokeFunction */:
        ;
        [error, result] = await this.invokeFunction(...data);
        break;
      case 2 /* GetStaticProperty */:
        ;
        [error, result] = await this.getStaticProperty(...data);
        break;
      case 3 /* SetStaticProperty */:
        ;
        [error, result] = await this.setStaticProperty(...data);
        break;
      case 4 /* InvokeStaticMethod */:
        ;
        [error, result] = await this.invokeStaticMethod(...data);
        break;
      case 5 /* InstantiateObject */:
        ;
        [error, result] = await this.instantiateObject(...data);
        break;
      case 6 /* GetInstanceProperty */:
        ;
        [error, result] = await this.getInstanceProperty(...data);
        break;
      case 7 /* SetInstanceProperty */:
        ;
        [error, result] = await this.setInstanceProperty(...data);
        break;
      case 8 /* InvokeInstanceMethod */:
        ;
        [error, result] = await this.invokeInstanceMethod(...data);
        break;
      case 9 /* DisposeObject */:
        ;
        [error, result] = this.disposeObject(...data);
        break;
      default:
        error = new ConcurrencyError(ErrorMessage.InvalidTaskType, type);
    }
    if (channel)
      this.channels.delete(coroutineId);
    return [error, result];
  }
  async handleDirectMessage(coroutineId, message) {
    const channel = this.channels.get(coroutineId);
    if (!channel)
      throw new ConcurrencyError(ErrorMessage.ChannelNotFound, coroutineId);
    let result, error;
    try {
      result = await channel.handleMessage(message[1], message[2]);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async handleDirectMessageReply(coroutineId, reply) {
    const channel = this.channels.get(coroutineId);
    if (!channel)
      throw new ConcurrencyError(ErrorMessage.ChannelNotFound, coroutineId);
    await channel.handleMessageReply(reply);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async invokeFunction(moduleSrc, functionName, args = [], _hasChannel) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const method = Reflect.get(module, functionName);
      result = await method.apply(module.exports, args);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async getStaticProperty(moduleSrc, exportName, propName) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const _export = Reflect.get(module, exportName);
      result = Reflect.get(_export, propName);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async setStaticProperty(moduleSrc, exportName, propName, value) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const _export = Reflect.get(module, exportName);
      result = Reflect.set(_export, propName, value);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async invokeStaticMethod(moduleSrc, exportName, methodName, args = [], _hasChannel) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const _export = Reflect.get(module, exportName);
      const method = Reflect.get(_export, methodName);
      result = await Reflect.apply(method, _export, args);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async instantiateObject(moduleSrc, exportName, args = []) {
    let result, error;
    try {
      const module = await import(moduleSrc);
      const ctor = Reflect.get(module, exportName);
      const obj = Reflect.construct(ctor, args);
      this.lastObjectId += 1;
      this.objects.set(this.lastObjectId, obj);
      result = [this.lastObjectId, getProperties(obj)];
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async getInstanceProperty(objectId, propName) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      result = Reflect.get(obj, propName);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  async setInstanceProperty(objectId, propName, value) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      result = Reflect.set(obj, propName, value);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async invokeInstanceMethod(objectId, methodName, args = [], _hasChannel) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let result, error;
    try {
      const method = Reflect.get(obj, methodName);
      result = await Reflect.apply(method, obj, args);
    } catch (err) {
      error = err;
    }
    return [error, result];
  }
  disposeObject(objectId) {
    const obj = this.objects.get(objectId);
    if (!obj)
      throw new ConcurrencyError(ErrorMessage.ObjectNotFound, objectId);
    let error;
    try {
      this.objects.delete(objectId);
    } catch (err) {
      error = err;
    }
    return [error, void 0];
  }
  prepareChannelIfAny(type, data, worker, coroutineId) {
    let channel;
    if (hasChannel(type, data)) {
      channel = new Channel(() => void 0);
      channel.init(worker, coroutineId);
      this.channels.set(coroutineId, channel);
      const args = getTaskArgs(type, data);
      args.push(channel);
    }
    return channel;
  }
};

// libs/platform/src/browser/worker_script.ts
if (void 0)
  throw new ConcurrencyError2(Constants.ErrorMessage.NotRunningOnWorker);
var manager = new WorkerManager();
onmessage = function(e) {
  const [type, data] = e.data;
  manager.handleMessage(type, data, {
    postMessage: (message) => {
      postMessage(message);
    }
  }).then((reply) => {
    if (reply)
      postMessage(reply);
  });
};

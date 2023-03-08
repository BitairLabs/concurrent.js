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
          map[key] = typeof descriptor?.value;
        }
      }
    }
    obj = isFunction(obj) ? Reflect.get(obj, "__proto__") : Reflect.getPrototypeOf(obj);
  }
  return map;
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

// libs/platform/src/core/worker_manager.ts
var WorkerManager = class {
  objects = /* @__PURE__ */ new Map();
  lastObjectId = 0;
  async handleMessage(type, data) {
    if (type == 1 /* RunTask */) {
      const [coroutineId, taskType, taskData] = data;
      let message;
      try {
        let error, result;
        switch (taskType) {
          case 1 /* InvokeFunction */:
            ;
            [error, result] = await this.invokeFunction(...taskData);
            break;
          case 2 /* GetStaticProperty */:
            ;
            [error, result] = await this.getStaticProperty(...taskData);
            break;
          case 3 /* SetStaticProperty */:
            ;
            [error, result] = await this.setStaticProperty(...taskData);
            break;
          case 4 /* InvokeStaticMethod */:
            ;
            [error, result] = await this.invokeStaticMethod(...taskData);
            break;
          case 5 /* InstantiateObject */:
            ;
            [error, result] = await this.instantiateObject(...taskData);
            break;
          case 6 /* GetInstanceProperty */:
            ;
            [error, result] = await this.getInstanceProperty(...taskData);
            break;
          case 7 /* SetInstanceProperty */:
            ;
            [error, result] = await this.setInstanceProperty(...taskData);
            break;
          case 8 /* InvokeInstanceMethod */:
            ;
            [error, result] = await this.invokeInstanceMethod(...taskData);
            break;
          case 9 /* DisposeObject */:
            ;
            [error, result] = this.disposeObject(...taskData);
            break;
          default:
            throw new ConcurrencyError(ErrorMessage.InvalidTaskType, taskType);
        }
        message = [2 /* ReadTaskResult */, [coroutineId, error, result]];
      } catch (error) {
        message = [
          2 /* ReadTaskResult */,
          [
            coroutineId,
            { message: error.message, code: error.code },
            void 0
          ]
        ];
      }
      return message;
    } else {
      throw new ConcurrencyError(ErrorMessage.InvalidMessageType, type);
    }
  }
  async invokeFunction(moduleSrc, functionName, args = []) {
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
  async invokeStaticMethod(moduleSrc, exportName, methodName, args = []) {
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
  async invokeInstanceMethod(objectId, methodName, args = []) {
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
};

// libs/platform/src/deno/worker_script.ts
if (void 0)
  throw new ConcurrencyError2(Constants.ErrorMessage.NotRunningOnWorker);
var manager = new WorkerManager();
onmessage = function(e) {
  const [type, data] = e.data;
  manager.handleMessage(type, data).then((reply) => {
    postMessage(reply);
  });
};

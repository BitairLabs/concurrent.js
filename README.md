# Intro

At the highest level of its design, Concurrent.js is a module loader like require and import. But instead of loading a module into the main thread, it loads the module into workers. Concurrent.js provides a simple "write less, do more" isomorphic API that works on Node.js, Deno, and browsers.

Concurrent.js injects the concurrent behavior into the imported classes and functions so they can be used as usual. Because of that, any type mismatch would be detected by TypeScript on compile time. This is perhaps the main advantage of Concurrent.js over similar libraries.

Important notes

- This is a helper library not a new implementation of Web Workers.
- This is an early version of the library and must not be used in a real project.

# Features

- [x] Supporting Node.js
- [x] Supporting browser
- [x] Supporting Deno
- [x] Executing JavaScript (ECMAScript & CommonJS)
- [ ] Executing TypeScript
- [ ] Executing WebAssembly
- [x] Accessing exported functions
- [ ] Accessing exported classes
  - [x] Instantiation
  - [x] Instance members
    - [x] Getters and setters
    - [x] Fields
    - [x] Methods
  - [ ] Static members
    - [ ] Methods
    - [ ] Getters and setters
    - [ ] Fields
- [ ] Reactive concurrency
  - [ ] Inter-worker communication
  - [ ] Event sourcing
  - [ ] Data sharing
- [ ] Dependency injection
- [ ] Sandboxing
- [ ] Language interoperability (Server-side)
  - [ ] C
  - [ ] Rust
  - [ ] Python

# Technical facts

- Has no runtime dependency.
- Built with Node.js and uses the ECMAScript module system.
- Alters nothing, no native nor programmer-defined.
- Written in TypeScript with the strictest ESNext config.
- Provides a strongly-typed syntax.
- Built upon web workers (a.k.a. worker threads).
- Creates a worker once and reuses it.
- Automatically cleans up a worker's memory.
- Automatically creates and terminates workers (scale up/down).
- Packaged as platform-specific bundles that target ES2020.

# Install

```bash
npm i @bitair/concurrent.js@latest
```

Save and run the [hello world](./scripts/hello_world.sh) script to see it in action:

```bash
bash hello_world.sh
```

# Usage

```ts
import { concurrent, AsyncSetter } from '@bitair/concurrent.js'
import type * as SampleModule from 'module-path'

// import
const { SampleObject, sampleFunction } = await concurrent.load<typeof SampleModule>('sample-module-path')

// instantiate
const obj = new SampleObject(1, 'arg2', { arg3_1: false }) // strongly-typed, any type mismatch would be detected.

// call a method
const result = await obj.sampleMethod(1, 'arg2', [1, 2, 3]) // strongly-typed

// read a field or getter
const value = await obj.sampleProp

// write a field or setter
await concurrent.set((obj.sampleProp = AsyncSetter(1))) // strongly-typed

// call a function
const result2 = await sampleFunction(1, 'arg2', [1, 2, 3]) // strongly-typed
```

## Sample

### Node.js (ECMAScript)

`index.js`

```js
import { concurrent } from '@bitair/concurrent.js'
const { factorial } = await concurrent.load('extra-bigint')
const result = await factorial(50n)
console.log(result)
await concurrent.terminate()
```

`package.json`

```json
{
  "type": "module",
  "dependencies": {
    "@bitair/concurrent.js": "^0.5.8",
    "extra-bigint": "^1.1.10"
  }
}
```

```bash
node .
```

### Deno

`index.ts`

```js
import { concurrent } from 'https://deno.land/x/concurrentjs@v0.5.8/dist/mod.ts'
const { factorial } = await concurrent.load(new URL('services/index.ts', import.meta.url))
const result = await factorial(50n)
console.log(result)
await concurrent.terminate()
```

`services/index.ts`

```js
export { factorial } from 'extra-bigint'
```

`deno.json`

```json
{
  "imports": {
    "extra-bigint": "npm:extra-bigint@^1.1.10"
  }
}
```

```bash
deno run --allow-read --allow-net index.ts
```

### Browser

```
.
├── src
    ├── services
        ├── index.js
    ├── app.js
    ├── worker_script.js
    .
├── static
    ├── index.html
.
```

`app.js`

```js
import { concurrent } from '@bitair/concurrent.js'
const { factorial } = await concurrent.load(new URL('services/index.js', import.meta.url))
const result = await factorial(50n)
console.log(result)
await concurrent.terminate()
```

`services/index.js`

```js
export { factorial } from 'extra-bigint'
```

`worker_script.js`

```js
import '@bitair/concurrent.js/worker_script'
```

`index.html`

```html
<!DOCTYPE html>
<html>
  <body>
    <script type="module" src="scripts/main.js"></script>
  </body>
</html>
```

`build.sh`

```bash
#!/bin/bash
npx esbuild src/app.js --bundle --format=esm --platform=browser --target=esnext --outfile=static/scripts/main.js
npx esbuild src/worker_script.js --bundle --format=esm --platform=browser --target=esnext --outfile=static/scripts/worker_script.js
npx esbuild src/services/index.js --bundle --format=esm --platform=browser --target=esnext --outfile=static/scripts/services/index.js
```

`package.json`

```json
{
  "type": "module",
  "dependencies": {
    "@bitair/concurrent.js": "^0.5.8",
    "http-server": "^14.1.1",
    "extra-bigint": "^1.1.10"
  },
  "devDependencies": {
    "esbuild": "^0.17.8"
  }
}
```

```bash
bash ./build.sh && npx http-server static
```

#### Base URL

Concurrent.js uses the import.meta.url property as the base URL to resolve the scripts. It's also possible to provide a custom base URL:

```bash
npx esbuild src/app.js --target=es6 --define:process.env.BASE_URL=\"http://127.0.0.1:8080/scripts/\" --bundle --format=esm --platform=browser --outfile=static/scripts/main.js
```

# Parallelism

For achieving parallelism the load method accepts a flag named `parallel`:

```js
import { concurrent } from '@bitair/concurrent.js'

concurrent.config({ maxThreads: 16 }) // Instead of a hardcoded value use os.availableParallelism() in Node.js v19.4.0 or later

const { factorial } = await concurrent.load('extra-bigint', { parallel: true })

const ops = []
for (let i = 0; i <= 100; i++) {
  ops.push(factorial(i))
}

const results = await Promise.all(ops)
// ...rest of the code

await concurrent.terminate()
```

## Instance disposal

In parallelism, instances must be explicitly disposed:

```js
const ops = []
for (let i = 0; i <= 100; i++) {
  const instance = SampleObject()
  const op = instance.sampleMethod().then((result) => {
    await concurrent.dispose(instance)
    return result
  })
  ops.push(op)
}

const results = await Promise.all(ops)
```

# API

```ts
concurrent.load<T>(src: string | URL, settings: ExecutionSettings) : T
```

Imports and prepares a module for being loaded into workers. Loading would happen on class instantiation and function invocation. In Concurrent.js every instantiation of an imported class and every invocation of an imported function would be run by a separate worker if available or by a shared worker if not (provided that the parallel flag is off).

Note that all members and dependencies of an in-worker instance would be run on the same worker that the instance has been instantiated on. This would guarantee that an in-worker instance would be run exactly like an out-worker instance, except that an in-worker instance has no access to the main thread's global values. This is also correct for running an imported function inside a worker.

- `src: string`

  The path or URL of the loading module. The value of this parameter must be either an absolute path/URL or a package name.

- `settings: ExecutionSettings`

  - `settings.parallel [default=false]`

    Setting it would prevent the load method to share a worker between instances and function calls.

  - `settings.timeout [default=Infinity] [Not implemented]`

    Setting it would prevent a parallel operation to occupy a thread forever. By reaching the timeout, Concurrent.js would terminate and re-instantiate the thread and also would throw a timeout exception. The setting can only be used when the parallel flag is on.

```ts
concurrent.config(settings: ConcurrencySettings): void
```

Configs the global settings of Concurrent.js

- `settings: ConcurrencySettings`

  - `settings.disabled: boolean [default=false]`

    Setting it would disable Concurrent.js without the requirement to change any other code.

  - `settings.maxThreads: number [default=1]`

    The max number of available threads to be spawned.

  - `settings.threadAllocationTimeout: number | typeof Infinity [default=Infinity]`

    Number of seconds that an operation would be waiting for a thread allocation. By reaching the timeout an exception would be thrown.

  - `settings.threadIdleTimeout: number | typeof Infinity [default=Infinity]`

    Number of minutes that Concurrent.js would be waiting before terminating an idle thread.

  - `settings.minThreads: number [default=0]`

    The minimum number of threads that should keep when terminating the idle threads.

```ts
concurrent.terminate(force?: boolean): Promise<void>
```

Terminates Concurrent.js

- `force?: boolean [Not implemented]`

  Forces Concurrent.js to exit immediately without waiting for workers to finish their tasks.

# License

MIT License

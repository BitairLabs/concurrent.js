[`CHANGE LOG`](./CHANGE.md) [`STAR HISTORY`](https://star-history.com/#bitair-org/concurrent.js&Timeline) [`CHANNEL`](https://www.reddit.com/r/concurrentjs/)

# Intro

At the highest level of its design, Concurrent.js is a dynamic module importer like `require` and `import`. But instead of loading a module into the main thread, it loads the module into a background thread. Concurrent.js helps with non-blocking computation on JavaScript RTEs and also provides a foreign function interface to other languages in order to achieve better performance and richer computational libraries.

# Sponsors

If you are interested in sponsoring the project, please contact us at [hello@bitair.org](mailto:hello@bitair.org).

# Features

- [x] Platform/Language support
  - [x] Web browsers
    - [x] JavaScript (ECMAScript & CommonJS)
    - [x] WebAssembly
  - [x] Node.js
    - [x] JavaScript (ECMAScript & CommonJS)
    - [x] C
    - [x] C++
    - [x] Go
    - [ ] Java
    - [ ] Python
    - [ ] Ruby
    - [x] Rust
    - [ ] TypeScript
    - [x] WebAssembly
  - [x] Deno
    - [x] JavaScript (ECMAScript & CommonJS)
    - [ ] C
    - [ ] C++
    - [ ] Go
    - [ ] Java
    - [ ] Python
    - [ ] Ruby
    - [ ] Rust
    - [x] TypeScript
    - [x] WebAssembly
- [x] Parallel execution
- [ ] Reactive concurrency
- [ ] Inter-worker data sharing
- [ ] Multithreaded dependency resolver
- [ ] Sandboxing

# Technical facts

- Built upon web workers (a.k.a. worker threads).
- Creates a worker once and reuses it.
- Automatically cleans up a worker's memory.
- Automatically creates and terminates workers.
- Has no third-party runtime dependency.
- Written in TypeScript with the strictest ESNext config.
- Strictly designed to support strongly-typed programming.
- Packaged as platform-specific bundles that target ES2020.

# Hello World!

Save and run the [hello world](./scripts/hello_world.sh) script to see it in action:

```bash
bash hello_world.sh
```

# Usage

## Running JavaScript

```js
import { concurrent } from '@bitair/concurrent.js'

// import and load a JS module into a worker
const { SampleObject, sampleFunction } = await concurrent.import('sample-js-module.js').load()

// run a function
const result = await sampleFunction(/*...args*/)

// run a class (instance members)
const obj = await new SampleObject(/*...args*/) // instantiate
const value = await obj.sampleProp // get a field or getter
await ((obj.sampleProp = 1), obj.sampleProp) // set a field or setter
const result = await obj.sampleMethod(/*...args*/) // call a method

// run a class (static members)
const value = await SampleObject.sampleStaticProp // get a static field or getter
await ((SampleObject.sampleStaticProp = 1), SampleObject.sampleStaticProp) // set a static field or setter
const result = await SampleObject.sampleStaticMethod(/*...args*/) // call a static method

// terminate Concurrent.js
await concurrent.terminate()
```

## Running WebAssembly

```js
import { concurrent } from '@bitair/concurrent.js'
const { sampleFunction } = await concurrent.import('sample-wasm-module.wasm').load()
const result = await sampleFunction(/*...args*/)
await concurrent.terminate()
```

## Running C, C++, Go and Rust 

This feature requires the [Linker.c package](https://github.com/bitair-org/linker.js) to be manually installed.

```js
import { concurrent, ExternFunctionReturnType } from '@bitair/concurrent.js'
const { sampleFunction } = await concurrent
  .import('shared-lib.so', {
    extern: {
      sampleFunction: ExternFunctionReturnType.Number
    }
  })
  .load()
const result = await sampleFunction(/*...args*/)
await concurrent.terminate()
```

## Projects

If you have built a project that uses Concurrent.js and you want to list it here, please email its details to [hello@bitair.org](mailto:hello@bitair.org).

- Browser

  - [Basic usage](./apps/sample/browser/) (Sample)
  - [Basic interop with WASM](./apps/sample/browser-wasm/) (Sample)
  - [Integration with Tensorflow](./apps/sample/browser-tensorflow/) (Sample)

- Node

  - [Basic usage](./apps/sample/node/) (Sample)

- Deno
  - [Basic usage](./apps/sample/deno/) (Sample)

## Sample

### Node.js (ECMAScript)

```bash
npm i @bitair/concurrent.js@latest
```

`index.js`

```js
import { concurrent } from '@bitair/concurrent.js'
const { factorial } = await concurrent.import('extra-bigint').load()
const result = await factorial(50n)
console.log(result)
await concurrent.terminate()
```

`package.json`

```json
{
  "type": "module",
  "dependencies": {
    "@bitair/concurrent.js": "^0.7.0",
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
import { concurrent } from 'https://deno.land/x/concurrentjs@v0.7.0/mod.ts'
const { factorial } = await concurrent.import(new URL('services/index.ts', import.meta.url)).load()
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
const { factorial } = await concurrent.import(new URL('services/index.js', import.meta.url)).load()
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
    "@bitair/concurrent.js": "^0.7.0",
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

# Parallelism

```js
import { concurrent } from '@bitair/concurrent.js'

const extraBigint = concurrent.import('extra-bigint')

concurrent.config({ maxThreads: 16 }) // Instead of a hardcoded value use os.availableParallelism() in Node.js v19.4.0 or later

const ops = []
for (let i = 0; i <= 100; i++) {
  const { factorial } = await extraBigint.load()
  ops.push(factorial(i))
}

const results = await Promise.all(ops)
// ...rest of the code

await concurrent.terminate()
```

# API

```ts
concurrent.import<T>(src: URL | string, options?: ModuleImportOptions): IConcurrentModule<T>
```

Imports and prepares the module for being loaded into workers. Note that only functions and classes can be imported. Importing and accessing classes only works on JavaScript and TypeScript languages.

- `src: URL | string`

  Source of the module. Must be either a URL or a package name. Note that passing a package name is only applicable in Node.js.

- `options?: ModuleImportOptions`

  - `ModuleImportOptions`
    ```ts
    type ModuleImportOptions = Partial<{
      extern: {
        [key: string]: ExternFunctionReturnType
      }
    }>
    ```
    - `ExternFunctionReturnType`
      ```ts
      enum ExternFunctionReturnType {
        ArrayBuffer,
        Boolean,
        Number,
        String
      }
      ```

```ts
IConcurrentModule<T>.load() : Promise<T>
```

Loads the module into a worker.

```ts
concurrent.config(settings: ConcurrencySettings): void
```

Configs the global settings of Concurrent.js.

- `settings: ConcurrencySettings`

  - `settings.maxThreads: number [default=1]`

    The max number of available threads to be spawned.

  - `settings.threadIdleTimeout: number | typeof Infinity [default=Infinity]`

    Number of minutes that Concurrent.js would be waiting before terminating an idle thread.

  - `settings.minThreads: number [default=0]`

    The number of threads that must be created when Concurrent.js starts and also kept from being terminated when are idle.

```ts
concurrent.terminate(force?: boolean): Promise<void>
```

Terminates Concurrent.js.

- `force?: boolean [Not implemented]`

  Forces Concurrent.js to exit immediately without waiting for workers to finish their tasks.

# License

[MIT License](./LICENSE)

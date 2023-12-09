[`CHANGE LOG`](./CHANGE.md) [`STAR HISTORY`](https://star-history.com/#bitair-org/concurrent.js&Timeline) [`COMMUNITY`](https://github.com/bitair-org/concurrent.js/discussions)

# Intro

Concurrent.js helps with non-blocking computation on JavaScript RTEs by dynamically loading a module into a background thread.

# Sponsors

If you are interested in sponsoring the project, please contact us at [hello@bitair.org](mailto:hello@bitair.org).

# Features

- [x] Parallel Execution
  - [x] JavaScript
    - [x] Deno
    - [x] Node.js
    - [x] Web browsers
  - [x] TypeScript
    - [x] Deno
- [x] Reactive concurrency

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
const { SampleObject, sampleFunction } = await concurrent.import(new URL('./sample_module.js', import.meta.url)).load()

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

## Projects

If you have built a project that uses Concurrent.js and you want to list it here, please email its details to [hello@bitair.org](mailto:hello@bitair.org).

- Browser

  - [Basic usage](./apps/sample/browser/) (Sample)
  - [Tensorflow.js](./apps/sample/browser-tensorflow/) (Sample)

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
    "@bitair/concurrent.js": "^0.8.1",
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
import { concurrent } from 'https://deno.land/x/concurrentjs@v0.8.1/mod.ts'
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
    "@bitair/concurrent.js": "^0.8.1",
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

concurrent.config({ maxThreads: 16 }) // Instead of a hardcoded value, use os.availableParallelism() in Node.js v19.4.0 or later

const ops = []
for (let i = 0; i <= 100; i++) {
  const { factorial } = await extraBigint.load()
  ops.push(factorial(i))
}

const results = await Promise.all(ops)
// ...rest of the code

await concurrent.terminate()
```

# Reactive concurrency

`services/index.js`

```js
export async function reactiveAdd(channel) {
  let done = false
  let sum = 0

  channel.onmessage(name => {
    if (name === 'done') done = true
  })

  let i = 0
  do {
    sum += await channel.postMessage('next', i++)
    // To give the onmessage handler an opportunity to receive the message, 
    // the execution of the while loop needs to be interrupted.
    await interrupt()
  } while (!done)

  return sum
}

function interrupt() {
  return new Promise(resolve => {
    const timer = setImmediate(() => {
      clearImmediate(timer)
      resolve(true)
    })
  })
}
```

`index.js`

```js
import { concurrent, Channel } from '@bitair/concurrent.js'

const { reactiveAdd } = await concurrent.import(new URL('./services/index.js', import.meta.url)).load()

const arr = [1, 2, 3, 4]

const result = await reactiveAdd(
  new Channel((onmessage, postMessage) => {
    onmessage(async (name, ...data) => {
      if (name === 'next') {
        const [i] = data
        if (i === arr.length - 1) await postMessage('done')
        return arr[i]
      }
    })
  })
)

console.assert(result === 10)
console.log('Done!')

await concurrent.terminate()
```

# API

```ts
concurrent.import<T>(src: URL | string): IConcurrentModule<T>
```

Prepares a module for being loaded into workers. Note that only functions and classes can be imported.

- `src: URL | string`

  Source of the module. Must be either a URL or a package name. Note that passing a package name is only applicable in Node.js.

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

    The number of threads that must be created when Concurrent.js starts and kept alive (they wouldn't be terminated when are idle, in order to avoid thread recreation overhead).

```ts
concurrent.terminate(force?: boolean): Promise<void>
```

Terminates Concurrent.js.

- `force?: boolean [Not implemented]`

  Forces Concurrent.js to exit immediately without waiting for workers to finish their tasks.

```ts
class Channel
```

Used for sending/receiving messages to/from functions and methods (instance or static). Note that a task can only have one channel, and that channel cannot be reused for another task. The channel argument must be the last argument of the invoking function or method.

- `constructor(listener: (onmessage: Channel['onmessage'], postMessage: Channel['postMessage']) => void)`
- `onmessage(handler: (name: string | number, ...data: unknown[]) => unknown): void`
- `postMessage(name: string | number, ...data: unknown[]): Promise<unknown>`

# License

[MIT License](./LICENSE)

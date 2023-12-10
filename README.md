# Concurrent.js

[Change Log](./CHANGE.md) | [Star History](https://star-history.com/#bitair-org/concurrent.js&Timeline) | [Community](https://github.com/bitair-org/concurrent.js/discussions)

Concurrent.js is a library that enables non-blocking computation on JavaScript RTEs by dynamically loading a module into a background thread.

## Features

- [x] Sharing workers
- [x] Parallel execution
- [x] Reactive concurrency
- [ ] Sandboxing

## Technical Facts

- Built upon web workers (a.k.a. worker threads).
- Simplifies the complexity of worker usage by providing a minimal API.
- Automatically creates and terminates workers.
- Automatically cleans up a worker's memory.
- Has no third-party runtime dependency.
- Written in TypeScript with the strictest ESNext config.
- Strictly designed to support strongly-typed programming.
- Packaged as platform-specific bundles that target ES2020.

## Hello World!

Save and run the [hello world](./scripts/hello_world.sh) script to see Concurrent.js in action:

```bash
bash hello_world.sh
```

## Installation

```bash
npm i @bitair/concurrent.js
```

## Usage

```js
import { concurrent } from '@bitair/concurrent.js'

// Import and load a JS module into a worker
const { SampleObject, sampleFunction } = 
  await concurrent.import(new URL('./sample_module.js', import.meta.url)).load()

// Run a function
const result = await sampleFunction(/*...args*/)

// Run a class (instance members)
const obj = await new SampleObject(/*...args*/) // Instantiate
const value = await obj.sampleProp // Get a field or getter
await ((obj.sampleProp = 1), obj.sampleProp) // Set a field or setter
const result = await obj.sampleMethod(/*...args*/) // Call a method

// Run a class (static members)
const value = await SampleObject.sampleStaticProp // Get a static field or getter
await ((SampleObject.sampleStaticProp = 1), SampleObject.sampleStaticProp) // Set a static field or setter
const result = await SampleObject.sampleStaticMethod(/*...args*/) // Call a static method

// Terminate Concurrent.js
await concurrent.terminate()
```

## Samples

- Browser
  - [Basic usage](./apps/sample/browser/)
  - [Tensorflow.js](./apps/sample/browser-tensorflow/)

- Node
  - [Basic usage](./apps/sample/node/)

- Deno
  - [Basic usage](./apps/sample/deno/)

## Parallelism

```js
import { concurrent } from '@bitair/concurrent.js'

const extraBigint = concurrent.import('extra-bigint')

concurrent.config({ maxThreads: 16 }) // Instead of a hardcoded value, use os.availableParallelism() in Node.js v19.4.0 or later

const tasks = []
for (let i = 0; i <= 100; i++) {
  const { factorial } = await extraBigint.load()
  tasks.push(factorial(i))
}

const results = await Promise.all(tasks)
// ...rest of the code

await concurrent.terminate()
```

## Reactive Concurrency

`services/index.mjs`

```js
// import type { IChannel } from '@bitair/concurrent.js'

export async function reactiveAdd(channel /*: IChannel */) {
  let done = false
  let sum = 0
  let i = 0

  channel.onmessage(name => {
    if (name === 'done') done = true
  })

  do {
    sum += await channel.postMessage('next', i++)
  } while (!done)

  return sum
}
```

`index.mjs`

```js
import { concurrent, Channel } from '@bitair/concurrent.js'

const { reactiveAdd } = 
  await concurrent.import(new URL('./services/index.mjs', import.meta.url)).load()

const channel = new Channel((onmessage, postMessage) => {
  const arr = [1, 2, 3, 4]

  onmessage(async (name, ...data) => {
    if (name === 'next') {
      const [i] = data
      if (i === arr.length - 1) await postMessage('done')
      return arr[i]
    }
  })
})

const result = await reactiveAdd(channel)
// ...rest of the code

await concurrent.terminate()
```

## API

```ts
concurrent.import<T>(src: URL | string): IConcurrentModule<T>
```

Prepares a module to be loaded into workers. Note that only functions and classes can be imported.

- `src: URL | string`

  Source of the module. Must be either a URL or a package name. Note that passing a package name is only applicable in Node.js.

```ts
IConcurrentModule<T>.load() : Promise<T>
```

Loads the module into a worker.

```ts
concurrent.config(settings: ConcurrencySettings): void
```

Configures the global settings of Concurrent.js.

- `settings: ConcurrencySettings`
  - `settings.maxThreads: number [default=1]`
  
    The maximum number of available threads to be spawned.
  - `settings.threadIdleTimeout: number | typeof Infinity [default=Infinity]`
  
    Number of minutes before Concurrent.js terminates an idle thread.
  - `settings.minThreads: number [default=0]`
  
    The number of threads created when Concurrent.js starts and kept alive to avoid thread recreation overhead.

```ts
concurrent.terminate(force?: boolean): Promise<void>
```

Terminates Concurrent.js.

- `force?: boolean [Not implemented]`
  Forces Concurrent.js to exit immediately without waiting for workers to finish their tasks.


```ts
class Channel implements IChannel
```

Used to send/receive messages to/from functions and methods (instance or static). Note that a function or method can only have one channel argument and it must be the last argument. The channel object cannot be reused to call another function or method.

- ```ts
  constructor(listener: (onmessage: Channel['onmessage'], postMessage: Channel['postMessage']) => void)
  ```

- ```ts
  onmessage(handler: (name: string | number, ...data: unknown[]) => unknown): void
  ```
  Sets the event handler for receiving a message. The handler should return a value if a reply is required for the message.

- ```ts
  postMessage(name: string | number, ...data: unknown[]): Promise<unknown>
  ```
  Sends a message to the other end and returns its reply.

## License

[MIT License](./LICENSE)
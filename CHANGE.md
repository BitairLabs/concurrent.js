## v0.8.2

- Bun is supported via the Node.js package.
- Tests cases are added for Bun.
- Benchmark project is added.

## v0.8.0

- Supporting language interop is dropped. The @bitair/linker.js package should be used instead.
- Reactive concurrency is implemented.

## v0.7.1

- Running Python libraries is implemented.

## v0.7.0

- Running C-shared libraries is implemented.

## v0.6.1

- Supporting a custom BASE_URL in the browser is dropped.
- New sample projects are added.

## v0.6.0

- New tests are added to the platform lib.
- Running WebAssembly modules is implemented.

## v0.5.15

- New tests are added to the platform lib.

## v0.5.14

- concurrent.module is renamed to concurrent.import.

## v0.5.13

- New tests are added to the platform lib.
- The mechanism of loading a module is simplified.
- The mechanism of allocating a thread is simplified.
- Exclusive thread allocation is removed.
- The dispose method is removed.
- Test coverage tool is added.

## v0.5.12

- Module loader is improved.

## v0.5.11

- Accessing an exported class is fully implemented.

## v0.5.10

- Module loader is improved.

## v0.5.9

- Syntax of setting a field/setter is improved.

## v0.5.8

- Accessing instance fields, getters and setters are implemented.

## v0.5.7

- Deno is supported.

## v0.5.6

- Auto object destruction is implemented using the JavaScript garbage collector. With this functionality using the dispose method is optional for non-parallel executions.
- Thread allocation is optimized using a centric interval instead of individual intervals for each allocation request.
- The core lib is merged into the platform lib.
- CJS and EMS entries are separated in the node platform.
- Building target and format specific builds for the browser platform are left for the application.
- The BASE_URL variable can be customized for browsers. Default is `import.meta.url`.
- The dist.sh script is optimized.

## v0.5.5

- The node and nodenext samples are merged into one project. Sampling CJS and ESM modules would be done at the build time.

## v0.5.3

- Resolved [issue#2](https://github.com/bitair-org/concurrent.js/issues/2).

## v0.5.2

- Unit testing is added to the sample projects, except the browser sample.
- Accessing and invoking exported functions is supported.
- The browser and node libs are merged into one project that's named 'platform'.
- Distribution script is changed to build different targeted bundles for browser(es6) and node(esnext).

## TODO

- Add unit testing to the browser sample project.
- Implement web API for setting the disable flag.

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
- README is updated.

## v0.5.5

- The node and nodenext samples are merged into one project. Sampling CJS and ESM modules would be done at the build time.
- README is updated.

## v0.5.3

- Resolved [issue#2](https://github.com/bitair-org/concurrent.js/issues/2).

## v0.5.2

- Unit testing is added to the sample projects, except the browser sample.
- Accessing and invoking exported functions is supported.
- The browser and node libs are merged into one project that's named 'platform'.
- Distribution script is changed to build different targeted bundles for browser(es6) and node(esnext).
- README is updated.

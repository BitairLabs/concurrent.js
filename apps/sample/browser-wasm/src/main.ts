import { concurrent } from '@bitair/concurrent.js'

import type * as wasmServices from '../../wasm/build/index.js'

const main = async () => {
  const services = await concurrent.import<typeof wasmServices>('./services/wasm/index.wasm').load()

  console.log(await services.add(1, 2))

  await concurrent.terminate()
}

main().finally()

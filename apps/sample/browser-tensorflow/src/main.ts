import { concurrent } from '@bitair/concurrent.js'

import type * as Services from './services/index.js'

const { LinearRegression } = await concurrent.import<typeof Services>('./services/index.js').load()

const regression = await new LinearRegression('meanSquaredError', 'sgd')
await regression.train([1, 2, 3, 4], [1, 3, 5, 7])

console.log(await regression.predict(5))

await concurrent.terminate()

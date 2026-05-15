#!/bin/bash

mkdir concurrent.js
cd concurrent.js
npm init -y
npm i @bitair/concurrent.js@latest extra-bigint
touch index.mjs

cat >./index.mjs <<EOF
import { concurrent } from '@bitair/concurrent.js'

// import the package as usual to see the difference
// import { factorial } from 'extra-bigint'

const { factorial } = await concurrent.import('extra-bigint').load()

// Create an interval to show that the main thread remains responsive
const progress = setInterval(() => process.stdout.write('⯀'), 100)

const n = 100_000n

console.log('\nNon-Blocking Computation of Factorial(%s)', n.toLocaleString())

const result = await factorial(n)

console.log(
  '\nThe result contains %s digits.',
  BigInt(result).toString().length.toLocaleString()
)

clearInterval(progress)

await concurrent.terminate()
EOF

node index.mjs

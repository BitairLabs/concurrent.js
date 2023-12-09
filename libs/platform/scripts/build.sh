#!/bin/bash

source "../../scripts/utils.sh"

function build {
  local file=$1
  local outfile=$2

  bundle node esm $file $outfile "--sourcemap --external:@bitair/*"
}

rm -rf build

build src/node/worker_script.ts build/node/worker_script.js
build test/node/sample_services/index.ts build/node/services/index.js

build src/deno/index.ts build/deno/index.js
build src/deno/worker_script.ts build/deno/worker_script.js


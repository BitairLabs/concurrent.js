#!/bin/bash

source "../../scripts/utils.sh"

function build {
  local file=$1
  local outfile=$2
  local params=$3

  bundle node esm $file $outfile --sourcemap $params
}

rm -rf build
build src/node/worker_script.ts build/worker_script.js
build test/sample_services/index.ts build/services/index.js

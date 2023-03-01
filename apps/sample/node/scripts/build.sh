#!/bin/bash

source "../../../scripts/utils.sh"

function build {
  local file=$1
  local format=$2

  case "$format" in
  cjs) local outfile=${file%.*}.js ;;
  *) local outfile=${file%.*}.mjs ;;
  esac

  bundle node $format $file build/$outfile --packages=external --sourcemap
}

rm -rf build
build src/index.ts cjs
build src/index.ts esm
build test/index.ts cjs
build test/index.ts esm

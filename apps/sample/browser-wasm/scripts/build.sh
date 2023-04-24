#!/bin/bash

source "../../../scripts/utils.sh"

function build {
  local file=$1
  local outfile=${file%.*}.js

  bundle browser esm src/$file static/scripts/build/$outfile
}

rm -rf static/scripts
build main.ts
build worker_script.ts

cd ../wasm
npm run build
cd ../browser-wasm
wasm_out_dir=./static/scripts/build/services/wasm
mkdir -p $wasm_out_dir
cp -r ../wasm/build/* ./static/scripts/build/services/wasm
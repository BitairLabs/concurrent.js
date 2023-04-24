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

cd ../../apps/sample/wasm
npm run build
cd ../../../libs/platform

mkdir build/sample_extern_libs
cd build/sample_extern_libs

mkdir c && mkdir cpp && mkdir go && mkdir rust

cd c
gcc -c -fPIC ../../../test/sample_extern_libs/c/lib.c && gcc -shared -o lib.so lib.o
cd ..

cd cpp
gcc -c -fPIC ../../../test/sample_extern_libs/cpp/lib.cpp && gcc -shared -o lib.so lib.o
cd ..

cd go
go build -o lib.so -buildmode=c-shared ../../../test/sample_extern_libs/go/lib.go 
cd ..

cd ../../test/sample_extern_libs/rust
cargo build --release --target-dir ../../../build/sample_extern_libs/rust

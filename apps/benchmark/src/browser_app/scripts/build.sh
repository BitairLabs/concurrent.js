#!/bin/bash

function build {
  local file=$1
  local outfile=${file%.*}.js

  npx esbuild src/browser_app/src/$file --bundle --format=esm --platform=browser --outfile=src/browser_app/static/scripts/build/$outfile
}

rm -rf src/browser_app/static/scripts
build main.ts
build worker_script.ts
build services/index.ts

#!/bin/bash

source "$(dirname $0)/utils.sh"

function bundle_index {
  local platform=$1
  local format=$2
  local file=libs/platform/src/$platform/index.ts

  case "$platform" in
  node)
    local file=libs/platform/src/$platform/index.$([ $format == cjs ] && echo cts || echo ts)
    local outfile=dist/src/node/index.$([ $format == cjs ] && echo cjs || echo js)
    ;;
  *)
    local file=libs/platform/src/$platform/index.ts
    local outfile=dist/src/$platform/index.js
    ;;
  esac

  bundle $([ $platform == deno ] && echo neutral || echo $platform) $format $file $outfile --external:./worker_script.js
}

function bundle_worker_script {
  local platform=$1
  local format=$2
  local file=libs/platform/src/$platform/worker_script.ts

  case "$platform" in
  node)
    local outfile=dist/src/node/worker_script.$([ $format == cjs ] && echo cjs || echo js)
    ;;
  *)
    local outfile=dist/src/$platform/worker_script.js
    ;;
  esac

  bundle $([ $platform == deno ] && echo neutral || echo $platform) $format $file $outfile
}

function build {
  local platform=$1
  if [ $platform = node ]; then
    bundle_index node cjs
    bundle_index node esm
    bundle_worker_script node cjs
    bundle_worker_script node esm
  else
    bundle_index $platform esm
    bundle_worker_script $platform esm
  fi
}

rm -rf dist/src
build browser
build node
build deno

# Copy typedef
echo dist/src/index.d.ts dist/src/index.d.cts | xargs -n 1 cp libs/platform/src/index.d.ts

# Copy LICENSE
cp LICENSE dist

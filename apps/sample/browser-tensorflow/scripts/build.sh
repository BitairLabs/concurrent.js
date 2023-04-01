#!/bin/bash

source "../../../scripts/utils.sh"

function build {
  local file=$1
  local params=$2
  local outfile=${file%.*}.js

  bundle browser esm src/$file static/scripts/build/$outfile $params
}

rm -rf static/scripts
build main.ts
build worker_script.ts
build services/index.ts

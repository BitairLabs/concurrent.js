#!/bin/bash

source "../../../scripts/utils.sh"

function build {
  local file=$1
  local params=$2
  local outfile=${file%.*}.js

  bundle browser esm src/$file static/scripts/build/$outfile $params
}

rm -rf static/scripts
build main.ts --define:process.env.BASE_URL=\"http://127.0.0.1:8080/scripts/build/\"
build worker_script.ts
build services/index.ts

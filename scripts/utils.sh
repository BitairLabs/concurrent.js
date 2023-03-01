#!/bin/bash

function bundle {
  local platform=$1
  local format=$2
  local file=$3
  local outfile=$4
  local params=$5

  npx esbuild $file --bundle --format=$format --platform=$platform --outfile=$outfile $params
}

function replace_dir {
  local source=$1
  local target=$2

  if [ -d $target ]; then
    rm -rf $target
  fi
  mkdir -p $target
  cp -r $source $target
}

export -f bundle replace_dir

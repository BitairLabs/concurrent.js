#!/bin/bash

BREAK=30

benchmark() {
    echo "Benchmarking $1"
    $2
    if [ "$#" -ne 3 ]; then
        echo -e "Cooling down for $BREAK seconds...\n"
        sleep $BREAK
    fi
}

benchmark Node.js "node src/index_node.js"
benchmark Deno "deno run --allow-net --allow-read src/index_deno.js"
benchmark Bun "bun run src/index_node.js"
benchmark Chrome "node src/index_browser.js chrome"
benchmark Firefox "node src/index_browser.js firefox" "done"

#!/usr/bin/env bash

set -e
DIR=$(cd "$(dirname "$0")" && pwd)
cd "$DIR"
set -x

./sh/check.js
bun x oxfmt
bun minify.js
bun x oxlint
bun test test/compare.test.js --only-failures

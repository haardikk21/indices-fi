#!/bin/bash
set -e
cd "$(dirname $0)"
cargo build -p index-token --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/index_token.wasm ./build/index_token.wasm

cargo build -p manager --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/manager.wasm ./build/manager.wasm

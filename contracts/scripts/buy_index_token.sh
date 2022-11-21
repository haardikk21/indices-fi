#!/bin/sh

source ./neardev/dev-account.env

near call $CONTRACT_NAME buy_index_token \
    "{\"near_amounts\": [\"6000000000000000\", \"10000000000000000\"], \"token_amount\": \"16\"}" \
    --accountId snehkoul.testnet --amount 1 --gas 300000000000000

#!/bin/sh

source ./neardev/dev-account.env

near call $CONTRACT_NAME redeem_index_token \
    "{\"token_amount\": \"2\"}" \
    --accountId snehkoul.testnet --amount 1 --gas 300000000000000

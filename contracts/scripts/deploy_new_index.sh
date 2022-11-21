#!/bin/sh

source ./neardev/dev-account.env

near call $CONTRACT_NAME deploy_new_index \
    "{ \"tokens\": [\"rft.tokenfactory.testnet\", \"rft.tokenfactory.testnet\"], \"pool_ids\": [0,2], \"metadata\": {\"spec\": \"ft-1.0.0\",\"name\": \"abcd\",\"symbol\": \"testIdx\",\"icon\": \"\",\"decimals\": 24}}" \
    --accountId $CONTRACT_NAME --amount 26 --gas 300000000000000

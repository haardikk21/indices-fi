#!/bin/sh

source ./neardev/dev-account.env

near call $CONTRACT_NAME new "" --accountId $CONTRACT_NAME --gas 300000000000000

#!/bin/sh

source ./neardev/dev-account.env

near view $CONTRACT_NAME get_index_tokens ""

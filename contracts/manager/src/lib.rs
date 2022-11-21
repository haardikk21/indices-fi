use std::vec;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::Vector;
use near_sdk::json_types::Base64VecU8;
use near_sdk::serde_json::json;
use near_sdk::{env, near_bindgen, AccountId, Balance, Gas, PanicOnDefault, Promise};
use serde::{Deserialize, Serialize};

const INDEX_TOKEN_WASM_CODE: &[u8] = include_bytes!("../../build/index_token.wasm");
const TWENTY_ONE_NEAR: Balance = 21 * 10_u128.pow(24);
const GAS: Gas = Gas(75_000_000_000_000);

#[derive(BorshDeserialize, BorshSerialize, Clone, Deserialize, Serialize)]
#[serde(crate = "near_sdk::serde")]
pub struct FungibleTokenMetadata {
    pub spec: String, // Should be ft-1.0.0 to indicate that a Fungible Token contract adheres to the current versions of this Metadata and the Fungible Token Core specs. This will allow consumers of the Fungible Token to know if they support the features of a given contract.
    pub name: String, // The human-readable name of the token.
    pub symbol: String, // The abbreviation, like wETH or AMPL.
    pub icon: Option<String>, // Icon of the fungible token.
    pub reference: Option<String>, // A link to a valid JSON file containing various keys offering supplementary details on the token
    pub reference_hash: Option<Base64VecU8>, // The base64-encoded sha256 hash of the JSON file contained in the reference field. This is to guard against off-chain tampering.
    pub decimals: u8, // used in frontends to show the proper significant digits of a token. This concept is explained well in this OpenZeppelin post. https://docs.openzeppelin.com/contracts/3.x/erc20#a-note-on-decimals
}

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    /// Tokens for this index
    index_tokens: Vector<AccountId>,
}

#[near_bindgen]
impl Contract {
    #[init]
    pub fn new() -> Self {
        assert!(!env::state_exists(), "Already initialized");
        Self {
            index_tokens: Vector::new(b"idt".to_vec()),
        }
    }

    #[payable]
    pub fn deploy_new_index(
        &mut self,
        metadata: FungibleTokenMetadata,
        tokens: Vec<AccountId>,
        pool_ids: Vec<u64>,
    ) -> AccountId {
        let new_account_id: AccountId = format!("{}.{}", metadata.name, env::current_account_id())
            .as_str()
            .parse()
            .unwrap();
        self.index_tokens.push(&new_account_id);

        let args = json!({ "total_supply": "1".to_owned(), "metadata": metadata, "tokens": tokens, "pool_ids": pool_ids  })
        .to_string()
        .into_bytes();
        Promise::new(new_account_id.clone())
            .create_account()
            .transfer(TWENTY_ONE_NEAR)
            .deploy_contract(INDEX_TOKEN_WASM_CODE.to_vec())
            .function_call(
                "new".to_owned(),
                args,
                env::attached_deposit() - TWENTY_ONE_NEAR,
                GAS,
            );

        new_account_id
    }

    pub fn get_index_tokens(&self) -> Vec<AccountId> {
        self.index_tokens.to_vec()
    }

    #[private]
    pub fn clean_state(&mut self) {
        self.index_tokens.clear();
    }
}

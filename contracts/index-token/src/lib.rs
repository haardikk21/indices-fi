use std::vec;

use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::collections::{LazyOption, LookupMap};
use near_sdk::json_types::U128;
use near_sdk::serde_json::json;
use near_sdk::{
    env, log, near_bindgen, AccountId, Balance, Gas, PanicOnDefault, Promise, PromiseResult,
    StorageUsage, ONE_YOCTO,
};

pub mod events;
pub mod ft_core;
pub mod internal;
pub mod metadata;
pub mod storage;

use crate::events::*;
use crate::metadata::*;

/// The specific version of the standard we're using
pub const FT_METADATA_SPEC: &str = "ft-1.0.0";

// External Contracts
const REF_FINANCE: &str = "ref-finance-101.testnet";
const WNEAR: &str = "wrap.testnet";

// XCC Values
const FIVE_TGAS: Gas = Gas(5000000000000);
const SEVEN_TGAS: Gas = Gas(7000000000000);
const TWENTY_TGAS: Gas = Gas(20000000000000);
const SIXTY_TGAS: Gas = Gas(60000000000000);
const STORAGE_DEPOSIT: Balance = 12500000000000000000000;
const POINT_ONE_NEAR: Balance = 10_u128.pow(23);

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]
pub struct Contract {
    /// Keep track of each account's balances
    pub accounts: LookupMap<AccountId, Balance>,

    /// Total supply of all tokens.
    pub total_supply: Balance,

    /// The bytes for the largest possible account ID that can be registered on the contract
    pub bytes_for_longest_account_id: StorageUsage,

    /// Metadata for the contract itself
    pub metadata: LazyOption<FungibleTokenMetadata>,

    /// Account ID for the owner
    pub owner_id: AccountId,

    /// Tokens for this index
    pub tokens: Vec<AccountId>,

    /// Pool ID's for all tokens against wNEAR
    pub pool_ids: Vec<u64>,

    // External Contracts
    pub ref_finance: AccountId,
    pub wnear: AccountId,
}

/// Helper structure for keys of the persistent collections.
#[derive(BorshSerialize)]
pub enum StorageKey {
    Accounts,
    Metadata,
}

#[near_bindgen]
impl Contract {
    /// Initializes the contract with the given total supply owned by the given `owner_id` with
    /// the given fungible token metadata.
    #[init]
    #[payable]
    pub fn new(
        total_supply: U128,
        metadata: FungibleTokenMetadata,
        tokens: Vec<AccountId>,
        pool_ids: Vec<u64>,
    ) -> Self {
        assert!(tokens.len() > 0, "NO_TOKENS_PROVIDED");
        assert_eq!(pool_ids.len(), tokens.len(), "POOL_IDS_TOKENS_LEN_MISMATCH");
        // Create a variable of type Self with all the fields initialized.
        let mut this = Self {
            // Set the total supply
            total_supply: total_supply.0,
            // Set the bytes for the longest account ID to 0 temporarily until it's calculated later
            bytes_for_longest_account_id: 0,
            // Storage keys are simply the prefixes used for the collections. This helps avoid data collision
            accounts: LookupMap::new(StorageKey::Accounts.try_to_vec().unwrap()),
            metadata: LazyOption::new(StorageKey::Metadata.try_to_vec().unwrap(), Some(&metadata)),
            owner_id: env::current_account_id(),
            pool_ids: pool_ids.clone(),
            tokens: tokens.clone(),
            ref_finance: REF_FINANCE.parse().unwrap(),
            wnear: WNEAR.parse().unwrap(),
        };

        // Measure the bytes for the longest account ID and store it in the contract.
        this.measure_bytes_for_longest_account_id();

        // Register the owner's account and set their balance to the total supply.
        this.internal_register_account(&env::current_account_id());
        this.internal_deposit(&env::current_account_id(), total_supply.into());

        // Emit an event showing that the FTs were minted
        FtMint {
            owner_id: &env::current_account_id(),
            amount: &total_supply,
            memo: Some("Initial token supply is minted"),
        }
        .emit();

        // Calculate remaining NEAR
        let remaining_near = env::attached_deposit()
            - (u128::try_from(tokens.len()).unwrap() * STORAGE_DEPOSIT)
            - (STORAGE_DEPOSIT)
            - POINT_ONE_NEAR
            - ONE_YOCTO;

        // Perform XCC Calls
        let no_args = json!({}).to_string().into_bytes();
        let mut promise: Promise = Promise::new(this.ref_finance.clone()).function_call(
            "storage_deposit".to_owned(),
            no_args,
            POINT_ONE_NEAR,
            FIVE_TGAS,
        );

        for token in this.tokens.iter() {
            promise = promise.and(this.token_storage_deposit(token.clone()));
        }

        promise = promise
            .and(this.token_storage_deposit(this.wnear.clone()))
            .and(this.register_tokens(this.ref_finance.clone()))
            .then(Promise::new(env::signer_account_id()).transfer(remaining_near));

        // Return the Contract object
        this
    }

    #[payable]
    pub fn buy_index_token(&mut self, near_amounts: Vec<U128>, token_amount: U128) -> Promise {
        assert_eq!(
            self.tokens.len(),
            near_amounts.len(),
            "NEAR_AMOUNTS_LEN_MISMATCH"
        );

        let amount_minus_security = env::attached_deposit()
            - (2 * u128::try_from(near_amounts.len()).unwrap() + 1) * ONE_YOCTO;
        let no_args = json!({}).to_string().into_bytes();
        let wnear_transfer_args = json!({
            "receiver_id": self.ref_finance.clone(),
            "amount": amount_minus_security.to_string(),
            "msg": ""
        })
        .to_string()
        .into_bytes();
        let callback_args = json!({ "token_amount": token_amount })
            .to_string()
            .into_bytes();

        let mut promise = self.token_storage_deposit_delegated(
            env::current_account_id(),
            env::predecessor_account_id(),
        );

        promise = promise.and(
            Promise::new(self.wnear.clone())
                .function_call(
                    "near_deposit".to_owned(),
                    no_args,
                    amount_minus_security,
                    SEVEN_TGAS,
                )
                .function_call(
                    "ft_transfer_call".to_owned(),
                    wnear_transfer_args,
                    ONE_YOCTO,
                    TWENTY_TGAS * 2,
                ),
        );

        promise = promise.then(self.swap_token(
            self.tokens.get(0).unwrap(),
            self.pool_ids.get(0).unwrap(),
            near_amounts.get(0).unwrap(),
        ));

        for i in 1..self.tokens.len() {
            promise = promise.and(self.swap_token(
                self.tokens.get(i).unwrap(),
                self.pool_ids.get(i).unwrap(),
                near_amounts.get(i).unwrap(),
            ))
        }

        promise = promise.then(Promise::new(env::current_account_id()).function_call(
            "buy_index_token_callback".to_owned(),
            callback_args,
            ONE_YOCTO * u128::try_from(self.tokens.len()).unwrap(),
            TWENTY_TGAS * 8,
        ));

        promise
    }

    #[payable]
    pub fn redeem_index_token(&mut self, token_amount: U128) {
        self.internal_transfer(
            &env::predecessor_account_id(),
            &env::current_account_id(),
            token_amount.into(),
            None,
        );
        let mut promise = self.token_storage_deposit_delegated(
            self.tokens.get(0).unwrap().clone(),
            env::predecessor_account_id(),
        );
        for i in 1..self.tokens.len() {
            promise = promise.and(self.token_storage_deposit_delegated(
                self.tokens.get(i).unwrap().clone(),
                env::predecessor_account_id(),
            ));
        }
        promise = promise.then(self.token_transfer_call(
            self.tokens.get(0).unwrap().clone(),
            env::predecessor_account_id(),
            token_amount,
        ));
        for i in 1..self.tokens.len() {
            promise = promise.and(self.token_transfer_call(
                self.tokens.get(i).unwrap().clone(),
                env::predecessor_account_id(),
                token_amount,
            ))
        }
    }

    #[private]
    #[payable]
    pub fn buy_index_token_callback(&mut self, token_amount: U128) -> Promise {
        let mut promise = Promise::new(self.ref_finance.clone());

        for i in 0..self.tokens.len() {
            let result = env::promise_result(i.try_into().unwrap());

            match result {
                PromiseResult::Failed => {
                    log!(format!("Promise number {i} failed"));
                }
                PromiseResult::NotReady => {
                    log!(format!("Promise number {i} is not ready yet"));
                }
                PromiseResult::Successful(value) => {
                    if let Ok(amount) = near_sdk::serde_json::from_slice::<U128>(&value) {
                        assert!(
                            amount.clone() >= token_amount.clone(),
                            "The Token amount is not equal"
                        );
                        promise =
                            self.withdraw_token(promise, self.tokens.get(i).unwrap(), token_amount);
                    } else {
                        log!(format!("Error deserializing call {i}"))
                    }
                }
            }
        }

        let mint_args = json!({
            "account_id": env::signer_account_id(),
            "amount": token_amount
        })
        .to_string()
        .into_bytes();

        promise = promise.then(Promise::new(env::current_account_id()).function_call(
            "ft_mint".to_owned(),
            mint_args,
            0,
            FIVE_TGAS,
        ));

        promise
    }

    fn register_tokens(&self, account: AccountId) -> Promise {
        let args = json!({
            "token_ids": &self.tokens
        })
        .to_string()
        .into_bytes();

        Promise::new(account.clone()).function_call(
            "register_tokens".to_owned(),
            args,
            ONE_YOCTO,
            FIVE_TGAS,
        )
    }

    fn token_transfer_call(
        &self,
        token: AccountId,
        receiver_id: AccountId,
        amount: U128,
    ) -> Promise {
        let args = json!({
            "receiver_id": receiver_id,
            "amount": amount,
            "msg": ""
        })
        .to_string()
        .into_bytes();
        Promise::new(token).function_call(
            "ft_transfer".to_owned(),
            args,
            ONE_YOCTO,
            TWENTY_TGAS * 2,
        )
    }
    fn token_storage_deposit(&self, token: AccountId) -> Promise {
        let args = json!({}).to_string().into_bytes();

        Promise::new(token.clone()).function_call(
            "storage_deposit".to_owned(),
            args,
            STORAGE_DEPOSIT,
            FIVE_TGAS,
        )
    }

    fn token_storage_deposit_delegated(&self, token: AccountId, user: AccountId) -> Promise {
        let args = json!({ "account_id": user }).to_string().into_bytes();

        Promise::new(token.clone()).function_call(
            "storage_deposit".to_owned(),
            args,
            STORAGE_DEPOSIT,
            FIVE_TGAS,
        )
    }
    fn swap_token(&self, token_out: &AccountId, pool_id: &u64, amount_in: &U128) -> Promise {
        let args = json!({
            "actions": [
                {
                    "pool_id": pool_id,
                    "token_in": self.wnear.clone(),
                    "amount_in": amount_in,
                    "token_out": token_out.to_string(),
                    "min_amount_out": "0".to_owned()
                }
            ]
        })
        .to_string()
        .into_bytes();

        Promise::new(self.ref_finance.clone()).function_call(
            "swap".to_owned(),
            args,
            ONE_YOCTO,
            TWENTY_TGAS,
        )
    }

    fn withdraw_token(&self, promise: Promise, token_out: &AccountId, amount: U128) -> Promise {
        let args = json!({
            "token_id": token_out.to_string(),
            "amount": amount
        })
        .to_string()
        .into_bytes();

        promise.function_call("withdraw".to_owned(), args, ONE_YOCTO, SIXTY_TGAS)
    }

    pub fn get_underlying_tokens(&self) -> Vec<AccountId> {
        self.tokens.clone()
    }

    pub fn get_underlying_poolids(&self) -> Vec<u64> {
        self.pool_ids.clone()
    }
}

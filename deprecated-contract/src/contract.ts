import {
  assert,
  call,
  initialize,
  near,
  NearBindgen,
  NearPromise,
} from "near-sdk-js";
import { promiseResult } from "near-sdk-js/lib/api";
import { AccountId, ONE_TERA_GAS, ONE_YOCTO } from "near-sdk-js/lib/types";
import { deserialize, serialize } from "near-sdk-js/lib/utils";

const FIVE_TGAS = 5n * ONE_TERA_GAS;
const SEVEN_TGAS = 7n * ONE_TERA_GAS;
const TWENTY_TGAS = 20n * ONE_TERA_GAS;
const STORAGE_DEPOSIT = BigInt("12500000000000000000000");

@NearBindgen({ requireInit: true })
export class IndicesToken {
  ref_finance: AccountId = "ref-finance-101.testnet";
  wrap_testnet: AccountId = "wrap.testnet";
  owner_id: AccountId;
  index_token_account: AccountId;
  tokens: AccountId[] = [];
  pool_ids: number[] = [];

  @initialize({ payableFunction: true })
  init({
    owner_id,
    index_token_account,
    tokens,
    pool_ids,
  }: {
    owner_id: AccountId;
    index_token_account: AccountId;
    tokens: AccountId[];
    pool_ids: number[];
  }) {
    assert(tokens.length > 0, "NO_TOKENS_PROVIDED");
    assert(pool_ids.length == tokens.length, "POOL_IDS_TOKENS_LEN_MISMATCH");
    this.tokens = tokens;
    this.pool_ids = pool_ids;
    this.owner_id = owner_id;
    this.index_token_account = index_token_account;

    const remainingNear =
      near.attachedDeposit() -
      (BigInt(this.tokens.length) + 3n) * STORAGE_DEPOSIT -
      ONE_YOCTO;

    let promise = this.registerTokens(this.ref_finance);
    promise = this.storageDeposit(this.tokens[0]);

    for (let i = 1; i < this.tokens.length; i++) {
      promise = promise.and(this.storageDeposit(this.tokens[i]));
    }

    promise = promise
      .and(this.storageDeposit(this.ref_finance))
      .and(this.storageDeposit(this.wrap_testnet))
      .then(NearPromise.new(near.signerAccountId()).transfer(remainingNear));

    return promise;
  }

  private storageDeposit(account: AccountId): NearPromise {
    return NearPromise.new(account).functionCall(
      "storage_deposit",
      serialize({}),
      STORAGE_DEPOSIT,
      FIVE_TGAS
    );
  }

  private registerTokens(account: AccountId): NearPromise {
    return NearPromise.new(account).functionCall(
      "register_tokens",
      serialize({
        token_ids: this.tokens,
      }),
      STORAGE_DEPOSIT,
      FIVE_TGAS
    );
  }

  private swapToken(
    token: AccountId,
    pool_id: number,
    amount_in: bigint
  ): NearPromise {
    return NearPromise.new(this.ref_finance).functionCall(
      "swap",
      serialize({
        actions: [
          {
            pool_id: pool_id,
            token_in: this.wrap_testnet,
            amount_in: amount_in.toString(),
            token_out: token,
            min_amount_out: "0",
          },
        ],
      }),
      ONE_YOCTO,
      TWENTY_TGAS
    );
  }

  private withdraw(
    promise: NearPromise,
    token: AccountId,
    amount: bigint
  ): NearPromise {
    return promise.functionCall(
      "withdraw",
      serialize({
        token_id: token,
        amount: amount,
      }),
      ONE_YOCTO,
      TWENTY_TGAS * 3n
    );
  }

  @call({ payableFunction: true })
  swap_token({
    token_amounts,
    near_amount,
  }: {
    token_amounts: bigint[];
    near_amount: bigint;
  }) {
    assert(
      this.tokens.length == token_amounts.length,
      "TOKEN_AMOUNTS_LENGTH_IS_INCORRECT"
    );
    let amountMinusSecurity =
      near.attachedDeposit() -
      (2n * BigInt(this.tokens.length) + 1n) * ONE_YOCTO;

    // 7 + 40 = 47
    const wrapNearAndTransferToRefPromise = NearPromise.new(this.wrap_testnet)
      .functionCall(
        "near_deposit",
        serialize({}),
        amountMinusSecurity,
        SEVEN_TGAS
      )
      .functionCall(
        "ft_transfer_call",
        serialize({
          receiver_id: this.ref_finance,
          amount: amountMinusSecurity.toString(),
          msg: "",
        }),
        ONE_YOCTO,
        TWENTY_TGAS * 2n
      );

    // 20 * tokens.length (2) = 40
    let swapPromises = wrapNearAndTransferToRefPromise.then(
      this.swapToken(this.tokens[0], this.pool_ids[0], token_amounts[0])
    );

    for (let i = 1; i < this.tokens.length; i++) {
      swapPromises = swapPromises.and(
        this.swapToken(this.tokens[i], this.pool_ids[i], token_amounts[i])
      );
    }

    const promise = swapPromises.then(
      NearPromise.new(near.currentAccountId()).functionCall(
        "withdraw_from_exchange",
        serialize({
          near_amount: near_amount,
        }),
        ONE_YOCTO * BigInt(this.tokens.length),
        TWENTY_TGAS * 8n
      )
    );

    return promise;
  }

  @call({ privateFunction: true, payableFunction: true })
  withdraw_from_exchange({ near_amount }): NearPromise {
    let tokenOuts = [];
    for (let i = 0; i < this.tokens.length; i++) {
      let tokenOut = promiseResult(i) as string;
      // TODO add an assert
      tokenOuts.push(deserialize(tokenOut));
    }

    let withdrawPromises = NearPromise.new(this.ref_finance);

    for (let i = 0; i < this.tokens.length; i++) {
      withdrawPromises = this.withdraw(
        withdrawPromises,
        this.tokens[i],
        tokenOuts[i]
      );
    }

    NearPromise.new(this.index_token_account).functionCall(
      "ft_mint"
    )
    return withdrawPromises;
  }
}

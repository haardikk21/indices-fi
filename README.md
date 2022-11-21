# Indices Finance

Indices Finance is a new DeFi lego building block, completely native to the NEAR blockchain, that makes crypto investing simple for everyone.

![](https://i.imgur.com/maqiOpn.png)
Indices leverages decentralized exchanges built on NEAR, such as Ref Finance, to build a decentralized protocol for creating, buying, and trading index funds on-chain.

## Video

Watch this YouTube video if you don't like reading :)

https://youtu.be/umD3PGXAldo

## Why?

Index funds have historically outperformed actively managed funds over the long run. In the last decade, only 26% of actively managed funds beat their index funds rivals according to a report by Morningstar. Additionally, hundreds of billions have flowed out of actively managed funds into index funds over the last decade as more and more investors in TradFi recognize the safety and low risk strategies that indexes offer.

Crypto investments, however, are mostly being actively managed right now - by folks who are not asset managers and don't know what they're doing - leading to billions in losses.

Indices makes it simple for asset managers, traders, and anyone alike to come in, create an index to share their trading strategies, and allow others to invest in that index along with them.

## How?

Indices is _completely_ decentralized and on-chain on the NEAR L1 blockchain. There are three major workflows that happen through our smart contracts:

1. Create Index
2. Buy Index
3. Redeem Index

Our contracts are divided into a **Manager** contract and various **Index** contracts.

### Manager Contract

The manager contract is responsible for a couple of core actions:

1. Keeping track of all index funds created through Indices
2. Letting users deploy their own index funds
   2.1 This action creates a subaccount, and deploys an **Index** contract to that subaccount.

The manager contract is currently deployed to `indices-finance.testnet` on the NEAR Testnet.

### Index Contract

The index contract is responsible for the meat of this protocol:

1. Buy Index
2. Redeem Index

There are various index contracts deployed to the NEAR testnet. These were all automatically deployed through the manager on various subaccounts:

1. `parasref.indices-finance.testnet`
2. `rftbanana.indices-finance.testnet`
3. `stablecoins.indices-finance.testnet`
4. `ethpulse.indices-finance.testnet`
5. `demoindex.indices-finance.testnet`
6. Your index here???

### Create Index

When a user wants to create a new index, they provide a few pieces of information to us:

1. Name of the index (nearbull)
2. Symbol for the index token ($NEARBULL)
3. Underlying Tokens
   3.1 Token Account IDs (eg. `aurora.testnet`)
   3.2 Token Pool IDs

The Token Pool ID is the ID of the simple pool in Ref Exchange for the token and `wrap.testnet`.

![](https://i.imgur.com/DVCa47A.png)

Once this information is provided, the **Manager** contract kicks in and does it's magic:

![](https://i.imgur.com/PXObocn.png)

1. It creates a new subaccount at `${name}.indices-finance.testnet`
2. It deploys the **Index** contract to that subaccount
3. It initializes the **Index** contract
   3.1 It initializes the Index FT token and sets metadata
   3.2 It registers all underlying tokens with Ref Exchange in case creator adds a non-whitelisted token
   3.3 It creates storage deposits in individual underlying token FT contracts for the new subaccount

Once this process is done, the new subaccount is tracked by the **Manager** contract and included in a vector of index token `AccountId`s.

### Buy Index

Users can explore indices created by other users on the _Explore_ page of the Indices website.

![](https://i.imgur.com/61XgqG0.png)
This explore page shows the following information about each index:

1. Name
2. Symbol
3. Underlying Tokens
4. Price of Index (Summing up prices of underlying tokens)

When a user finds an index they want to invest in, they enter the amount they'd like to purchase and proceed with the transaction. A single transaction.

![](https://i.imgur.com/vurX07V.png)

This fires off the `buy_index_token` method in the **Index** contract, leading to a series of steps:

![](https://i.imgur.com/2ngzFfb.png)

1. The frontend calculates the appropriate amount of NEAR deposit to send to the contract to ensure the purchase happens successfully
2. The contract converts NEAR to wNEAR through `wrap.testnet`
3. The wNEAR is deposited to Ref Exchange
4. The contract executes `swap`s on Ref Exchange for wNEAR to each of the underlying tokens
   4.1 These actions happen in parallel through the use of `.and()` chaining
5. Then, a callback accumulates the amounts of each tokens we received from Ref after the swaps
6. The callback ensures we got greater than or equal amount of tokens from each swap as expected
7. Then, `withdraw`s are fired off on Ref Exchange to withdraw all those tokens into the **Index** contract
   7.1 These actions happen in parallel through the use of `.and()` chaining
8. Once all tokens are withdrawns, new $NAME (Index Token Symbol) tokens are minted
9. The user receives Index Tokens, representing their share in the fund

An example transaction that followed this approach can be found here:

### Redeem Index

Once a user has bought index tokens, they can track all their holdings in the Portfolio section of our website.
![](https://i.imgur.com/eLRVOfa.png)
This portfolio page shows all the various indexes you're invested in, how many shares you own, and the value of each share denominated in yoctoNEAR (due to liquidity issues on Testnet).

If you ever want to convert these shares into the actual underlying tokens (for whatever reason) - you can go through the Redeem flow by clicking the Redeem button. This calls `redeem_index_token` on the **Index** contract leading to a series of steps:

1. Burns the user's index token shares
2. Registers `storage_deposit`s for the user's account for all the underlying tokens
3. Transfers all the underlying tokens into the user's account

## Achievements

1. Learnt Rust (well, at least the basics)
2. Built out integration with Ref Exchange to deposit, swap, and withdraw
3. Compressed 10+ XCC calls into a single transaction and I'm proud of the way the promise chaining works
4. Built out the manager contract to make it easy to deploy new indexes
5. Got to a fully working demo, functional frontend, live and deployed

## Challenges

I faced a variety of challenges while building out this protocol:

- I first created all our smart contracts using the NEAR JS SDK in Typescript, however due to the documentation not being as up to date or as vast as the Rust SDK we were getting stuck on various steps across the way. A few days before submission, I took it upon myself to learn the basics of Rust, and redid both the contracts in Rust. It's probably not the best-looking Rust code, but I've never coded in Rust before.
- Gas estimation issues across a series of cross-contract calls are frustrating. Due to the number of cross-contract calls we make, particularly in `buy_index_token`, figuring out gas deposits for each was an issue. One of the core realizations I had was that it doesn't actually matter _how much_ gas is being used by a function when called from the CLI, what matters is how much gas they've reserved for further cross-contract calls in their codebase. For example, FT Transfer reserves 35 TGas, even though it needs less than 20 TGas. I spent A LOT of time, more than I'd like to admit, on figuring out how to properly send static gas across all our contract calls.
- The lack of liquidity on testnet for ref exchange, and Ref's docs also being outdated (for eg. pointing to an older, incorrect contract address on testnet rather than the one they actually use on testnet) caused a lot of weird bugs we couldn't figure out how to solve or why they were happening until we realized the code in their Github is not the one on `ref-finance.testnet` because the actual address they use on testnet is `ref-finance-101.testnet`.

## Future Plan

As good as this is, there are still some things that need to be done to achieve parity with TradFi index funds.

1. Index Funds are typically rebalanced on a timely basis (quartlerly, half-yearly, yearly, etc). We would like to add an abstract wrapper over the current Index contract implementation, that allows rebalancing through the use of switching out the underlying tokens and automatically swapping pre-rebalance holdings for post-rebalance holdings. This will enable index funds to be mutable over time and adjust the thematic exposure according to what's happening in the market.
2. Rebalancing securely requires a DAO to remain fully decentralized. Each individual index should form a DAO where token holders can vote on rebalance proposals on a timely basis, which causes the underlying tokens to be switched out for new ones.
3. Index creators should be able to attach a performance fees to their index, thereby being incentivized to share their trading strategies with the wider audience.
4. Indices Finance overall should have a meta-governance token that allows adjusting various parameters of the protocol, including underlying DEXes, contract architecture, performance fees adjustments on indexes created by us, etc.
5. Audits
6. Mainnet launch

## Utility

This is a starting step towards building more DeFi legos on NEAR.

Going forward, there could be meta-indices. Index funds that contain other index fund tokens within them.

Other protocols could also create derivatives of the index tokens to allow leverage trading and such. Synthetic tokens could allow for NEAR-native indexes of real-world stocks - effectively being able to recreate the S&P 500 on NEAR completely on-chain.

The rest is upto imagination.

## Humor

Join us to make crypto investing simple for everyone. Read our testimonials below:

![](https://i.imgur.com/jyWgUzo.png)

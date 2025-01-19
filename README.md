# Veil Privacy Pools Indexer

This is a Ponder indexer for the Veil privacy pools on Base network. It indexes events and maintains state for the following pools:

Public Pools:

- Pool 1 (0.005 ETH): `0x6c206B5389de4e5a23FdF13BF38104CE8Dd2eD5f`
- Pool 2 (0.05 ETH): `0xC53510D6F535Ba0943b1007f082Af3410fBeA4F7`

Private Pools:

- Pool 3 (0.01 ETH): `0x844bB2917dD363Be5567f9587151c2aAa2E345D2`
- Pool 4 (0.1 ETH): `0xD3560eF60Dd06E27b699372c3da1b741c80B7D90`
- Pool 5 (1 ETH): `0x9cCdFf5f69d93F4Fcd6bE81FeB7f79649cb6319b`

The indexer tracks:

- Deposits and withdrawals for each pool
- Merkle tree state (roots, leaves, indices)
- Commitments and nullifier hashes
- Pool statistics and validator contracts

It provides a REST API for querying pool data, transactions, and statistics.

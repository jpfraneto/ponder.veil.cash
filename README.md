# Veil Privacy Pools Indexer

This is a [Ponder](https://ponder.sh/) indexer for the Veil privacy pools on Base network.

It indexes events and maintains an up-to-datestate for the following pools:

Public Pools:

- Pool 1 (0.005 ETH): [`0x6c206B5389de4e5a23FdF13BF38104CE8Dd2eD5f`](https://www.basescan.org/address/0x6c206B5389de4e5a23FdF13BF38104CE8Dd2eD5f)
- Pool 2 (0.05 ETH): [`0xC53510D6F535Ba0943b1007f082Af3410fBeA4F7`](https://www.basescan.org/address/0xC53510D6F535Ba0943b1007f082Af3410fBeA4F7)

Private Pools:

- Pool 3 (0.01 ETH): [`0x844bB2917dD363Be5567f9587151c2aAa2E345D2`](https://www.basescan.org/address/0x844bB2917dD363Be5567f9587151c2aAa2E345D2)
- Pool 4 (0.1 ETH): [`0xD3560eF60Dd06E27b699372c3da1b741c80B7D90`](https://www.basescan.org/address/0xD3560eF60Dd06E27b699372c3da1b741c80B7D90)
- Pool 5 (1 ETH): [`0x9cCdFf5f69d93F4Fcd6bE81FeB7f79649cb6319b`](https://www.basescan.org/address/0x9cCdFf5f69d93F4Fcd6bE81FeB7f79649cb6319b)

The indexer tracks:

- Deposits and withdrawals for each pool
- Merkle tree state (roots, leaves, indices)
- Commitments and nullifier hashes
- Pool statistics and validator contracts

It provides a REST API for querying pool data, transactions, and statistics:

## REST API Endpoints

### Pools

- `GET /pools` - Get all pools with their deposits and withdrawals
- `GET /pool/:id` - Get details for a specific pool by ID

### Deposits

- `GET /deposits` - Get paginated list of deposits
  - Query params:
    - `cursor`: For pagination
    - `limit`: Number of results (default: 20, max: 100)
    - `direction`: "next" or "prev" for pagination direction
    - `poolId`: Filter by specific pool

### Withdrawals

- `GET /withdrawals` - Get paginated list of withdrawals
  - Query params:
    - `cursor`: For pagination
    - `limit`: Number of results (default: 20, max: 100)
    - `direction`: "next" or "prev" for pagination direction
    - `poolId`: Filter by specific pool

### Commitments

- `GET /commitments/:hash` - Get commitment details by hash

### Nullifiers

- `GET /nullifier/:hash` - Get nullifier details by hash

### Statistics

- `GET /stats` - Get overall statistics including:
  - Total deposits and withdrawals
  - Per-pool stats with denominations
  - Individual pool deposits and withdrawals

All endpoints return JSON responses. Pagination is supported via cursor-based pagination where applicable.

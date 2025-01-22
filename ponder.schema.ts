// ponder.schema.ts

// This file defines the database schema for the Veil Privacy Pools indexer using Ponder.
// Ponder is a framework for indexing blockchain data into a structured database.
// The schema defines tables and relationships that will be used to store and query pool data.

import { onchainTable, primaryKey, relations } from "ponder";

// Pool table stores the main configuration and state for each privacy pool
export const pool = onchainTable("pool", (t) => ({
  id: t.text().primaryKey(), // Contract address of the pool
  denomination: t.bigint().notNull(), // Amount in wei (0.005, 0.01, 0.05, 0.1, or 1 ETH)
  totalDeposits: t.integer().notNull().default(0), // Counter for total deposits made
  totalWithdrawals: t.integer().notNull().default(0), // Counter for total withdrawals
  lastLeafIndex: t.integer().notNull().default(0), // Latest index in the merkle tree
  validatorContract: t.hex().notNull(), // Address of the validator contract
  veilDeployer: t.hex().notNull(), // Address of the Veil deployer contract
}));

// Define relationships between pool and other tables
export const poolRelations = relations(pool, ({ many }) => ({
  deposits: many(deposit), // One pool can have many deposits
  withdrawals: many(withdrawal), // One pool can have many withdrawals
  commitments: many(commitment), // One pool can have many commitments
}));

// Deposit table tracks individual deposits into privacy pools
export const deposit = onchainTable("deposit", (t) => ({
  id: t.text().primaryKey(), // Unique commitment hash for the deposit
  poolId: t.text().notNull(), // Reference to the pool this deposit belongs to
  sender: t.hex().notNull(), // Address that made the deposit
  leafIndex: t.integer().notNull(), // Position in the merkle tree
  timestamp: t.bigint().notNull(), // When the deposit was made
  isSpent: t.boolean().notNull().default(false), // Whether deposit has been withdrawn
}));

// Link deposits back to their pool
export const depositRelations = relations(deposit, ({ one }) => ({
  pool: one(pool, {
    fields: [deposit.poolId],
    references: [pool.id],
  }),
}));

// Withdrawal table tracks withdrawals from privacy pools
export const withdrawal = onchainTable("withdrawal", (t) => ({
  id: t.text().primaryKey(), // Nullifier hash that proves right to withdraw
  poolId: t.text().notNull(), // Pool the withdrawal is from
  recipient: t.hex().notNull(), // Address receiving the withdrawal
  relayer: t.hex().notNull(), // Address that processed the withdrawal
  fee: t.bigint().notNull(), // Fee paid to relayer
  timestamp: t.bigint().notNull(), // When withdrawal occurred
  depositId: t.text(), // Links back to the original deposit commitment
}));

// Link withdrawals to their pool and original deposit
export const withdrawalRelations = relations(withdrawal, ({ one }) => ({
  pool: one(pool, {
    fields: [withdrawal.poolId],
    references: [pool.id],
  }),
  deposit: one(deposit, {
    fields: [withdrawal.depositId],
    references: [deposit.id],
  }),
}));

// Commitment table tracks merkle tree leaves for zero-knowledge proofs
export const commitment = onchainTable(
  "commitment",
  (t) => ({
    hash: t.hex().notNull(), // Commitment hash
    poolId: t.text().notNull(), // Pool this commitment belongs to
    index: t.integer().notNull(), // Position in merkle tree
    timestamp: t.bigint().notNull(), // When commitment was created
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.hash, table.poolId] }), // Composite primary key
  })
);

// Link commitments to their pool
export const commitmentRelations = relations(commitment, ({ one }) => ({
  pool: one(pool, {
    fields: [commitment.poolId],
    references: [pool.id],
  }),
}));

// Track spent nullifiers across all pools to prevent double-spending
export const nullifierHash = onchainTable("nullifier_hash", (t) => ({
  hash: t.hex().primaryKey(), // Unique nullifier hash
  poolId: t.text().notNull(), // Pool this nullifier belongs to
  timestamp: t.bigint().notNull(), // When nullifier was spent
}));

// Link nullifiers to their pool
export const nullifierHashRelations = relations(nullifierHash, ({ one }) => ({
  pool: one(pool, {
    fields: [nullifierHash.poolId],
    references: [pool.id],
  }),
}));

// Track valid merkle tree roots for each pool for proof verification
export const merkleRoot = onchainTable(
  "merkle_root",
  (t) => ({
    root: t.hex().notNull(), // Merkle root hash
    poolId: t.text().notNull(), // Pool this root belongs to
    timestamp: t.bigint().notNull(), // When root was created
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.root, table.poolId] }), // Composite primary key
  })
);

// Link merkle roots to their pool
export const merkleRootRelations = relations(merkleRoot, ({ one }) => ({
  pool: one(pool, {
    fields: [merkleRoot.poolId],
    references: [pool.id],
  }),
}));

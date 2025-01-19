// ponder.schema.ts

import { onchainTable, primaryKey, relations } from "ponder";

export const pool = onchainTable("pool", (t) => ({
  id: t.text().primaryKey(), // Contract address
  denomination: t.bigint().notNull(), // Amount in wei (0.005, 0.01, 0.05, 0.1, or 1 ETH)
  totalDeposits: t.integer().notNull().default(0),
  totalWithdrawals: t.integer().notNull().default(0),
  lastLeafIndex: t.integer().notNull().default(0),
  validatorContract: t.hex().notNull(),
  veilDeployer: t.hex().notNull(),
}));

export const poolRelations = relations(pool, ({ many }) => ({
  deposits: many(deposit),
  withdrawals: many(withdrawal),
  commitments: many(commitment),
}));

export const deposit = onchainTable("deposit", (t) => ({
  id: t.text().primaryKey(), // commitment hash
  poolId: t.text().notNull(), // Reference to pool contract address
  sender: t.hex().notNull(),
  leafIndex: t.integer().notNull(),
  timestamp: t.bigint().notNull(),
  isSpent: t.boolean().notNull().default(false),
}));

export const depositRelations = relations(deposit, ({ one }) => ({
  pool: one(pool, {
    fields: [deposit.poolId],
    references: [pool.id],
  }),
}));

export const withdrawal = onchainTable("withdrawal", (t) => ({
  id: t.text().primaryKey(), // nullifierHash
  poolId: t.text().notNull(),
  recipient: t.hex().notNull(),
  relayer: t.hex().notNull(),
  fee: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  depositId: t.text(), // Reference to the original deposit commitment
}));

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

export const commitment = onchainTable(
  "commitment",
  (t) => ({
    hash: t.hex().notNull(),
    poolId: t.text().notNull(),
    index: t.integer().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.hash, table.poolId] }),
  })
);

export const commitmentRelations = relations(commitment, ({ one }) => ({
  pool: one(pool, {
    fields: [commitment.poolId],
    references: [pool.id],
  }),
}));

// Track spent nullifiers across all pools
export const nullifierHash = onchainTable("nullifier_hash", (t) => ({
  hash: t.hex().primaryKey(),
  poolId: t.text().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const nullifierHashRelations = relations(nullifierHash, ({ one }) => ({
  pool: one(pool, {
    fields: [nullifierHash.poolId],
    references: [pool.id],
  }),
}));

// Track merkle tree roots for each pool
export const merkleRoot = onchainTable(
  "merkle_root",
  (t) => ({
    root: t.hex().notNull(),
    poolId: t.text().notNull(),
    timestamp: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.root, table.poolId] }),
  })
);

export const merkleRootRelations = relations(merkleRoot, ({ one }) => ({
  pool: one(pool, {
    fields: [merkleRoot.poolId],
    references: [pool.id],
  }),
}));

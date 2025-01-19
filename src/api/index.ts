/**
 * @file src/api/index.ts
 * @description Type-safe API routes for the Veil privacy pools
 */

import { Context, ponder } from "ponder:registry";
import {
  pool as PoolTable,
  deposit as DepositTable,
  withdrawal as WithdrawalTable,
  commitment as CommitmentTable,
  nullifierHash as NullifierHashTable,
  merkleRoot as MerkleRootTable,
} from "ponder:schema";
import { eq, desc, and, gt, lt, sql } from "ponder";

// Constants
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Pool denominations in ETH for reference
const POOL_DENOMINATIONS = {
  "0x6c206B5389de4e5a23FdF13BF38104CE8Dd2eD5f": "0.005", // Public Pool 1
  "0xC53510D6F535Ba0943b1007f082Af3410fBeA4F7": "0.05", // Public Pool 2
  "0x844bB2917dD363Be5567f9587151c2aAa2E345D2": "0.01", // Private Pool 3
  "0xD3560eF60Dd06E27b699372c3da1b741c80B7D90": "0.1", // Private Pool 4
  "0x9cCdFf5f69d93F4Fcd6bE81FeB7f79649cb6319b": "1", // Private Pool 5
} as const;

// Utility Functions
const serializeBigInt = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)])
    );
  }
  return obj;
};

const getPaginationParams = (c: any) => {
  const cursor = c.req.query("cursor") || null;
  const limit = Math.min(
    parseInt(c.req.query("limit") || DEFAULT_PAGE_SIZE.toString()),
    MAX_PAGE_SIZE
  );
  const direction = c.req.query("direction") === "prev" ? "prev" : "next";
  return { cursor, limit, direction };
};

// Pool Endpoints
ponder.get("/pools", async (c) => {
  const pools = await c.db.query.pool.findMany({
    with: {
      deposits: true,
      withdrawals: true,
    },
  });

  return c.json(serializeBigInt(pools));
});

ponder.get("/pool/:id", async (c) => {
  const poolId = c.req.param("id");
  if (!poolId) return c.json({ error: "Pool ID required" }, 400);

  const pool = await c.db.query.pool.findFirst({
    where: (fields) => eq(fields.id, poolId),
    with: {
      deposits: true,
      withdrawals: true,
    },
  });

  if (!pool) return c.json({ error: "Pool not found" }, 404);
  return c.json(serializeBigInt(pool));
});

// Deposit Endpoints
ponder.get("/deposits", async (c) => {
  const { cursor, limit, direction } = getPaginationParams(c);
  const poolId = c.req.query("poolId");

  const deposits = await c.db.query.deposit.findMany({
    limit: limit + 1,
    orderBy: (fields) => [desc(fields.timestamp)],
    where: (fields) =>
      poolId
        ? and(
            eq(fields.poolId, poolId),
            cursor
              ? direction === "next"
                ? lt(fields.timestamp, BigInt(cursor))
                : gt(fields.timestamp, BigInt(cursor))
              : undefined
          )
        : cursor
        ? direction === "next"
          ? lt(fields.timestamp, BigInt(cursor))
          : gt(fields.timestamp, BigInt(cursor))
        : undefined,
  });

  const hasMore = deposits.length > limit;
  const items = deposits.slice(0, limit);

  return c.json(
    serializeBigInt({
      items,
      nextCursor: hasMore
        ? items[items.length - 1]?.timestamp?.toString()
        : null,
      prevCursor: cursor ? deposits[0]?.timestamp?.toString() : null,
    })
  );
});

// Withdrawal Endpoints
ponder.get("/withdrawals", async (c) => {
  const { cursor, limit, direction } = getPaginationParams(c);
  const poolId = c.req.query("poolId");

  const withdrawals = await c.db.query.withdrawal.findMany({
    limit: limit + 1,
    orderBy: (fields) => [desc(fields.timestamp)],
    where: (fields) =>
      poolId
        ? and(
            eq(fields.poolId, poolId),
            cursor
              ? direction === "next"
                ? lt(fields.timestamp, BigInt(cursor))
                : gt(fields.timestamp, BigInt(cursor))
              : undefined
          )
        : cursor
        ? direction === "next"
          ? lt(fields.timestamp, BigInt(cursor))
          : gt(fields.timestamp, BigInt(cursor))
        : undefined,
  });

  const hasMore = withdrawals.length > limit;
  const items = withdrawals.slice(0, limit);

  return c.json(
    serializeBigInt({
      items,
      nextCursor: hasMore
        ? items[items.length - 1]?.timestamp?.toString()
        : null,
      prevCursor: cursor ? withdrawals[0]?.timestamp?.toString() : null,
    })
  );
});

// Commitment Endpoints
ponder.get("/commitments/:hash", async (c) => {
  const hash = c.req.param("hash");
  if (!hash) return c.json({ error: "Commitment hash required" }, 400);

  const commitment = await c.db.query.commitment.findFirst({
    where: (fields) => eq(fields.hash, hash as `0x${string}`),
  });

  if (!commitment) return c.json({ error: "Commitment not found" }, 404);
  return c.json(serializeBigInt(commitment));
});

// Nullifier Endpoints
ponder.get("/nullifier/:hash", async (c) => {
  const hash = c.req.param("hash");
  if (!hash) return c.json({ error: "Nullifier hash required" }, 400);

  const nullifier = await c.db.query.nullifierHash.findFirst({
    where: (fields) => eq(fields.hash, hash as `0x${string}`),
  });

  if (!nullifier) return c.json({ error: "Nullifier not found" }, 404);
  return c.json(serializeBigInt(nullifier));
});

// Stats Endpoints
ponder.get("/stats", async (c) => {
  const [totalDeposits, totalWithdrawals, poolStats] = await Promise.all([
    c.db.select({ count: sql`count(*)` }).from(DepositTable),
    c.db.select({ count: sql`count(*)` }).from(WithdrawalTable),
    c.db.query.pool.findMany({
      columns: {
        id: true,
        totalDeposits: true,
        totalWithdrawals: true,
      },
    }),
  ]);

  const stats = {
    totalDeposits: Number(totalDeposits[0]?.count || 0),
    totalWithdrawals: Number(totalWithdrawals[0]?.count || 0),
    poolStats: poolStats.map((pool) => ({
      poolId: pool.id,
      denomination:
        POOL_DENOMINATIONS[pool.id as keyof typeof POOL_DENOMINATIONS],
      deposits: pool.totalDeposits,
      withdrawals: pool.totalWithdrawals,
    })),
  };

  return c.json(serializeBigInt(stats));
});

export default ponder;

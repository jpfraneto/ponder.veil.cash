import { eq } from "drizzle-orm";
import { ponder } from "ponder:registry";
import {
  pool,
  deposit,
  withdrawal,
  commitment,
  nullifierHash,
  merkleRoot,
} from "ponder:schema";
import { parseEther } from "viem";
import { VeilPoolAbi } from "../abis/VeilPoolAbi";

// Pool denominations
const POOL_DENOMINATIONS = {
  "0x6c206B5389de4e5a23FdF13BF38104CE8Dd2eD5f": "0.005", // Public Pool 1
  "0xC53510D6F535Ba0943b1007f082Af3410fBeA4F7": "0.05", // Public Pool 2
  "0x844bB2917dD363Be5567f9587151c2aAa2E345D2": "0.01", // Private Pool 3
  "0xD3560eF60Dd06E27b699372c3da1b741c80B7D90": "0.1", // Private Pool 4
  "0x9cCdFf5f69d93F4Fcd6bE81FeB7f79649cb6319b": "1", // Private Pool 5
} as const;

// Initialize pools on first event
async function initializePool(
  poolAddress: string,
  context: any
): Promise<void> {
  const { db, client } = context;

  // Check if pool already exists
  const existingPool = await db.find(pool, { id: poolAddress });
  if (existingPool) return;

  const denomination = parseEther(
    POOL_DENOMINATIONS[poolAddress as keyof typeof POOL_DENOMINATIONS]
  );

  const validatorContract = await client.readContract({
    abi: VeilPoolAbi,
    address: poolAddress,
    functionName: "validatorContract",
  });

  const veilDeployer = await client.readContract({
    abi: VeilPoolAbi,
    address: poolAddress,
    functionName: "veilDeployer",
  });

  await db.insert(pool).values({
    id: poolAddress,
    denomination,
    totalDeposits: 0,
    totalWithdrawals: 0,
    lastLeafIndex: 0,
    validatorContract,
    veilDeployer,
  });
}

ponder.on("VeilPool005:Deposit", async ({ event, context }) => {
  const { db } = context;
  const poolAddress = event.log.address;
  await initializePool(poolAddress, context);

  // Insert deposit
  await db.insert(deposit).values({
    id: event.args.commitment,
    poolId: poolAddress,
    sender: event.args.sender,
    leafIndex: Number(event.args.leafIndex),
    timestamp: event.args.timestamp,
    isSpent: false,
  });

  // Update pool stats
  await db.update(pool, { id: poolAddress }).set((pool) => ({
    totalDeposits: pool.totalDeposits + 1,
    lastLeafIndex: Number(event.args.leafIndex),
  }));

  // Insert commitment
  await db.insert(commitment).values({
    hash: event.args.commitment,
    poolId: poolAddress,
    index: Number(event.args.leafIndex),
    timestamp: event.args.timestamp,
  });
});

ponder.on("VeilPool005:Withdrawal", async ({ event, context }) => {
  const { db } = context;
  const poolAddress = event.log.address;
  await initializePool(poolAddress, context);

  // Insert withdrawal
  await db.insert(withdrawal).values({
    id: event.args.nullifierHash,
    poolId: poolAddress,
    recipient: event.args.to,
    relayer: event.args.relayer,
    fee: event.args.fee,
    timestamp: event.args.timestamp,
  });

  // Insert nullifier hash
  await db.insert(nullifierHash).values({
    hash: event.args.nullifierHash,
    poolId: poolAddress,
    timestamp: event.args.timestamp,
  });

  // Update pool stats
  await db.update(pool, { id: poolAddress }).set((pool) => ({
    totalWithdrawals: pool.totalWithdrawals + 1,
  }));

  // Find and update deposit
  const depositToSpend = await db.find(deposit, {
    id: event.args.nullifierHash,
  });

  if (depositToSpend) {
    await db.update(deposit, { id: depositToSpend.id }).set({ isSpent: true });
  }
});

ponder.on("VeilPool005:UpdateVerifiedDepositor", async ({ event, context }) => {
  const { db } = context;
  const poolAddress = event.log.address;

  await db
    .update(pool, { id: poolAddress })
    .set({ validatorContract: event.args.newVeilVerifier });
});

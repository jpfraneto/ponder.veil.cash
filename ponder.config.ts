// ponder.config.ts
import { createConfig } from "ponder";
import { http } from "viem";

// Import ABIs - assuming all pools share the same ABI
import { VeilPoolAbi } from "./abis/VeilPoolAbi";

// Contract addresses from environment variables
const POOL_ADDRESSES = {
  PublicPool1: process.env.DEPOSIT_PUBLIC_POOL_1_ADDRESS!, // 0.005 ETH
  PublicPool2: process.env.DEPOSIT_PUBLIC_POOL_2_ADDRESS!, // 0.05 ETH
  PrivatePool3: process.env.DEPOSIT_PRIVATE_POOL_3_ADDRESS!, // 0.01 ETH
  PrivatePool4: process.env.DEPOSIT_PRIVATE_POOL_4_ADDRESS!, // 0.1 ETH
  PrivatePool5: process.env.DEPOSIT_PRIVATE_POOL_5_ADDRESS!, // 1 ETH
};

// Ensure all required environment variables are present
Object.entries(POOL_ADDRESSES).forEach(([name, address]) => {
  if (!address) {
    throw new Error(`Missing environment variable for ${name}`);
  }
});

export default createConfig({
  networks: {
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    // 0.005 ETH Pool
    VeilPool005: {
      abi: VeilPoolAbi,
      address: POOL_ADDRESSES.PublicPool1 as `0x${string}`,
      network: "base",
      startBlock: 24532656,
    },
    // 0.05 ETH Pool
    VeilPool05: {
      abi: VeilPoolAbi,
      address: POOL_ADDRESSES.PublicPool2 as `0x${string}`,
      network: "base",
      startBlock: 24702141,
    },
    // 0.01 ETH Pool
    VeilPool01: {
      abi: VeilPoolAbi,
      address: POOL_ADDRESSES.PrivatePool3 as `0x${string}`,
      network: "base",
      startBlock: 24532656,
    },
    // 0.1 ETH Pool
    VeilPool1: {
      abi: VeilPoolAbi,
      address: POOL_ADDRESSES.PrivatePool4 as `0x${string}`,
      network: "base",
      startBlock: 24532655,
    },
    // 1 ETH Pool
    VeilPool10: {
      abi: VeilPoolAbi,
      address: POOL_ADDRESSES.PrivatePool5 as `0x${string}`,
      network: "base",
      startBlock: 24532655,
    },
  },
});

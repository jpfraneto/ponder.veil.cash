// ponder.config.ts
import { createConfig } from "ponder";
import { http } from "viem";

// Import ABI - all pools share the same ABI
import { VeilPoolAbi } from "./abis/VeilPoolAbi";

const PublicPool1 =
  "0x6c206B5389de4e5a23FdF13BF38104CE8Dd2eD5f" as `0x${string}`; // 0.005 ETH
const PublicPool2 =
  "0xC53510D6F535Ba0943b1007f082Af3410fBeA4F7" as `0x${string}`; // 0.05 ETH
const PrivatePool3 =
  "0x844bB2917dD363Be5567f9587151c2aAa2E345D2" as `0x${string}`; // 0.01 ETH
const PrivatePool4 =
  "0xD3560eF60Dd06E27b699372c3da1b741c80B7D90" as `0x${string}`; // 0.1 ETH
const PrivatePool5 =
  "0x9cCdFf5f69d93F4Fcd6bE81FeB7f79649cb6319b" as `0x${string}`; // 1 ETH

export default createConfig({
  networks: {
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    VeilDotCash: {
      abi: VeilPoolAbi,
      address: [
        PublicPool1,
        PublicPool2,
        PrivatePool3,
        PrivatePool4,
        PrivatePool5,
      ],
      network: "base",
      startBlock: 24532655,
    },
  },
});

// --------- OLD CONFIG ---------

// export default createConfig({
//   networks: {
//     base: {
//       chainId: 8453,
//       transport: http(process.env.PONDER_RPC_URL_8453),
//     },
//   },
//   contracts: {
//     // 0.005 ETH Pool
//     VeilPool005: {
//       abi: VeilPoolAbi,
//       address: POOL_ADDRESSES.PublicPool1 as `0x${string}`,
//       network: "base",
//       startBlock: 24532656,
//     },
//     // 0.05 ETH Pool
//     VeilPool05: {
//       abi: VeilPoolAbi,
//       address: POOL_ADDRESSES.PublicPool2 as `0x${string}`,
//       network: "base",
//       startBlock: 24702141,
//     },
//     // 0.01 ETH Pool
//     VeilPool01: {
//       abi: VeilPoolAbi,
//       address: POOL_ADDRESSES.PrivatePool3 as `0x${string}`,
//       network: "base",
//       startBlock: 24532656,
//     },
//     // 0.1 ETH Pool
//     VeilPool1: {
//       abi: VeilPoolAbi,
//       address: POOL_ADDRESSES.PrivatePool4 as `0x${string}`,
//       network: "base",
//       startBlock:  ,
//     },
//     // 1 ETH Pool
//     VeilPool10: {
//       abi: VeilPoolAbi,
//       address: POOL_ADDRESSES.PrivatePool5 as `0x${string}`,
//       network: "base",
//       startBlock: 24532655,
//     },
//   },
// });

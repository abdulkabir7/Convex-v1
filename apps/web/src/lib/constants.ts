import { type Address } from "viem";

export const MANAGER_CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_MANAGER_ADDRESS?.trim() ||
  "0xd59A8fdf194F41fFb46888d63909F298DF600F30"
) as Address;

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL?.trim() ||
  "https://rpc.mainnet.arc.io";

export const DEFAULT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID?.trim() || "5042"
);

export const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WC_PROJECT_ID?.trim() ||
  "bbd247378e89e58df9b556683f410774";

export const RESOLVER_ADDRESS = (
  process.env.NEXT_PUBLIC_RESOLVER_ADDRESS?.trim() ||
  "0x42562D5Eadb7EFEd4997C580eA60f2D2f7D58018"
) as Address;




import { Address, Hex, PublicClient, WalletClient, createPublicClient, formatUnits, parseUnits, http } from "viem";

import { MANAGER_CONTRACT_ADDRESS, RPC_URL } from "@/lib/constants";
import { arcMainnet } from "@/lib/chains";
import { convexManagerAbi } from "./convex-manager";

export { convexManagerAbi };

export interface MarketStruct {
  questionId: Hex;
  metadataURI: string;
  creator: Address;
  resolver: Address;
  closeTime: bigint;
  resolveTime: bigint;
  protocolFeeBps: number;
  creatorFeeBps: number;
  yesPool: bigint;
  noPool: bigint;
  payoutPool: bigint;
  totalWinningStake: bigint;
  status: number;
  winningOutcome: number;
  usesOracle: boolean;
}

export function decodeMarketStruct(raw: any): MarketStruct {
  const [
    questionId,
    metadataURI,
    creator,
    resolver,
    closeTime,
    resolveTime,
    protocolFeeBps,
    creatorFeeBps,
    yesPool,
    noPool,
    payoutPool,
    totalWinningStake,
    status,
    winningOutcome,
    usesOracle,
  ] = raw as [
    Hex,
    string,
    Address,
    Address,
    bigint,
    bigint,
    number,
    number,
    bigint,
    bigint,
    bigint,
    bigint,
    number,
    number,
    boolean
  ];

  return {
    questionId,
    metadataURI,
    creator,
    resolver,
    closeTime,
    resolveTime,
    protocolFeeBps,
    creatorFeeBps,
    yesPool,
    noPool,
    payoutPool,
    totalWinningStake,
    status,
    winningOutcome,
    usesOracle,
  };
}

let cachedPublicClient: PublicClient | null = null;

export function getPublicClient(): PublicClient {
  if (!cachedPublicClient) {
    cachedPublicClient = createPublicClient({
      chain: arcMainnet,
      transport: http(RPC_URL),
    });
  }
  return cachedPublicClient;
}

export async function fetchOnChainMarket(
  client: PublicClient,
  marketId: number
): Promise<MarketStruct | null> {
  try {
    const result = await client.readContract({
      address: MANAGER_CONTRACT_ADDRESS,
      abi: convexManagerAbi,
      functionName: "markets",
      args: [marketId],
    });
    return decodeMarketStruct(result);
  } catch (error) {
    console.error("Failed to read market struct", { marketId, error });
    return null;
  }
}

export async function fetchUserPosition(
  client: PublicClient,
  marketId: number,
  user: Address
) {
  const [yesStake, noStake] = (await client.readContract({
    address: MANAGER_CONTRACT_ADDRESS,
    abi: convexManagerAbi,
    functionName: "positionOf",
    args: [marketId, user],
  })) as [bigint, bigint];

  return {
    yesStake,
    noStake,
  };
}

export async function stakeOnMarket(
  walletClient: WalletClient,
  publicClient: PublicClient,
  marketId: number,
  outcome: "yes" | "no",
  amount: bigint
) {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error("Wallet not connected");
  }

  const outcomeEnum = outcome === "yes" ? 1 : 2;
  if (!walletClient.account) {
    throw new Error("Wallet account not available");
  }
  const hash = await walletClient.writeContract({
    account: walletClient.account,
    address: MANAGER_CONTRACT_ADDRESS,
    abi: convexManagerAbi,
    functionName: "stake",
    args: [marketId, outcomeEnum, amount],
    chain: arcMainnet,
    value: amount,
  });

  await publicClient.waitForTransactionReceipt({ hash });

  return hash;
}

export async function claimWinnings(
  walletClient: WalletClient,
  publicClient: PublicClient,
  marketId: number
) {
  if (!walletClient.account) {
    throw new Error("Wallet account not available");
  }
  const hash = await walletClient.writeContract({
    account: walletClient.account,
    address: MANAGER_CONTRACT_ADDRESS,
    abi: convexManagerAbi,
    functionName: "claim",
    args: [marketId],
    chain: arcMainnet,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export function formatTokenAmount(value: bigint, decimals = 18): number {
  return Number(formatUnits(value, decimals));
}

export function toTokenValue(amount: string | number, decimals = 18): bigint {
  return parseUnits(String(amount), decimals);
}


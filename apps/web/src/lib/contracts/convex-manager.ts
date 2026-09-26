import { parseAbi, type Address } from "viem";
import { MANAGER_CONTRACT_ADDRESS } from "@/lib/constants";

export const CONVEX_MANAGER_ADDRESS = MANAGER_CONTRACT_ADDRESS as Address;

export const CREATOR_ROLE = "0x828634d95e775031b9ff576b159a8509d3053581a8c9c4d7d86899e0afcd882f" as const;
export const RESOLVER_ROLE = "0x92a19c77d2ea87c7f81d50c74403cb2f401780f3ad919571121efe2bdb427eb1" as const;
export const GUARDIAN_ROLE = "0x55435dd261a4b9b3364963f7738a7a662ad9c84396d64be3365284bb7f0a5041" as const;

export const convexManagerAbi = parseAbi([
  "function createMarket((uint8 marketType,uint64 closeTime,address resolver,uint16 protocolFeeBps,uint16 creatorFeeBps,bytes32 metadataHash,bytes extraData) params) external returns (uint32)",
  "function stake(uint32 marketId, uint8 outcome, uint128 amount) payable",
  "function claim(uint32 marketId) external",
  "function resolveMarket(uint32 marketId, uint8 outcome) external",
  "function markets(uint32 marketId) external view returns (uint8 marketType,uint8 status,uint8 winningOutcome,address creator,address resolver,uint64 closeTime,uint64 resolveTime,uint16 protocolFeeBps,uint16 creatorFeeBps,uint128 yesPool,uint128 noPool,uint128 payoutPool,uint128 totalWinningStake,bytes32 metadataHash)",
  "function positionOf(uint32 marketId, address account) external view returns (uint128 yesStake, uint128 noStake)",
  "function nextMarketId() external view returns (uint32)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function getPriceConfig(uint32 marketId) external view returns (address feed,int192 targetValue,uint8 comparator)",
  "function getSportsConfig(uint32 marketId) external view returns (bytes32 fixtureId,bytes32 leagueId,string endpoint)",
  "event MarketCreated(uint32 indexed marketId,uint8 indexed marketType,address indexed resolver,uint64 closeTime,bytes32 metadataHash)",
  "event MarketResolved(uint32 indexed marketId,uint8 outcome,uint128 payoutPool,uint128 totalWinningStake,bytes resolverContext)",
  "event StakePlaced(uint32 indexed marketId,address indexed account,uint8 outcome,uint256 amount)",
  "event StakeClaimed(uint32 indexed marketId,address indexed account,uint256 payout,bool wasVoid)",
]);

export enum MarketType {
  Price = 0,
  Sports = 1,
}

export enum Outcome {
  Undefined = 0,
  Yes = 1,
  No = 2,
}

export enum MarketStatus {
  Live = 0,
  Resolving = 1,
  Resolved = 2,
  Void = 3,
}

export enum Comparator {
  GreaterThan = 0,
  GreaterThanOrEqual = 1,
  LessThan = 2,
  LessThanOrEqual = 3,
}

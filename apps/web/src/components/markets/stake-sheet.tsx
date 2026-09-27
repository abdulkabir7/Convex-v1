"use client";

import { useMemo, useState } from "react";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { MarketViewModel } from "@/types/market";
import { stakeOnMarket, toTokenValue } from "@/lib/contracts/manager";
import { formatNumber } from "@/lib/number";
import { arcMainnet } from "@/lib/chains";

type StakeSheetProps = {
  market: MarketViewModel | null;
  choice: "yes" | "no" | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StakeSheet({ market, choice, open, onOpenChange }: StakeSheetProps) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [stakeValue, setStakeValue] = useState("5");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: arcMainnet.id });
  const { data: walletClient } = useWalletClient({ chainId: arcMainnet.id });
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  const multiplier = useMemo(() => {
    if (!market || !choice) return 0;
    return choice === "yes" ? market.yesMultiplier : market.noMultiplier;
  }, [choice, market]);

  const potentialReward = useMemo(() => {
    if (!stakeValue) return null;
    return (Number(stakeValue) * multiplier).toFixed(2);
  }, [multiplier, stakeValue]);

  const handleConfirm = async () => {
    if (!market || !choice) return;
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    if (chainId !== arcMainnet.id) {
      try {
        await switchChainAsync({ chainId: arcMainnet.id });
        setErrorMessage("Arc Mainnet selected. Confirm your stake again.");
      } catch (error) {
        setErrorMessage((error as Error).message || "Switch your wallet to Arc Mainnet to stake.");
      }
      return;
    }
    if (!publicClient || !walletClient) {
      setErrorMessage("Wallet not ready. Please try again.");
      return;
    }
    if (!market.onChainMarketId) {
      setErrorMessage("This market is not yet live on-chain.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const amount = toTokenValue(stakeValue);
      await stakeOnMarket(walletClient, publicClient, market.onChainMarketId, choice, amount);
      onOpenChange(false);
    } catch (error) {
      console.error("Stake failed", error);
      const message = (error as Error).message ?? "Failed to stake";
      setErrorMessage(
        /infura|eth_getBlockByNumber|failed to fetch/i.test(message)
          ? `Your wallet RPC failed while preparing the Arc transaction. Confirm its Arc Mainnet RPC is ${arcMainnet.rpcUrls.default.http[0]}, then retry. Details: ${message}`
          : message
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={
          isDesktop
            ? "h-full w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-[#0d111a] p-6 text-white"
            : "max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-zinc-800 bg-[#0d111a] p-5 text-white sm:p-6"
        }
      >
        {market && choice && (
          <>
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl font-semibold text-white">
                Confirm native stake
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm text-muted-foreground">
                {market.title}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-zinc-800 bg-secondary/50 p-4 text-xs text-muted-foreground">
                <p className="flex items-center justify-between text-sm font-semibold text-white">
                  <span>Current pool</span>
                  <span>{formatNumber(market.totalPool, 2)} USDC</span>
                </p>
                <p className="mt-2 flex items-center justify-between">
                  <span>Yes side</span>
                  <span>
                    {formatNumber(market.yesPool, 2)} USDC ({market.yesOdds}%)
                  </span>
                </p>
                <p className="flex items-center justify-between">
                  <span>No side</span>
                  <span>
                    {formatNumber(market.noPool, 2)} USDC ({market.noOdds}%)
                  </span>
                </p>
              </div>

              <div className={`rounded-2xl border p-4 text-sm ${choice === "yes" ? "border-primary/30 bg-primary/10" : "border-rose-500/30 bg-rose-500/10"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">You picked</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${choice === "yes" ? "bg-primary/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                    {choice.toUpperCase()}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span>Multiplier</span>
                  <span className="font-semibold text-white">{multiplier.toFixed(1)}x</span>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <label className="text-sm font-medium text-white" htmlFor="stake-input">
                  Stake amount
                </label>
                <div className="flex items-center rounded-2xl border border-zinc-800 bg-secondary/50 px-4 py-3">
                  <input
                    id="stake-input"
                    type="number"
                    min={1}
                    step={1}
                    value={stakeValue}
                    onChange={(event) => setStakeValue(event.target.value)}
                    className="w-full bg-transparent text-base font-semibold text-white outline-none ring-0"
                    placeholder="5"
                  />
                  <span className="text-sm font-semibold text-primary">USDC</span>
                </div>
                <div className="flex gap-2">
                  {[1, 5, 25, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setStakeValue(String(amount))}
                      className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${
                        Number(stakeValue) === amount
                          ? "bg-primary text-white"
                          : "bg-secondary text-zinc-400 hover:text-white"
                      }`}
                    >
                        {amount} USDC
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-secondary/50 p-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Estimated reward</span>
                  <span className="text-base font-semibold text-white">
                    {potentialReward ? `${potentialReward} USDC` : "--"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Your wallet sends native USDC directly. No approval transaction required.
                </p>
              </div>

              {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

              <Button
                disabled={isProcessing || isSwitchingChain || !market?.canStake || !choice || !market.onChainMarketId}
                onClick={handleConfirm}
                className="w-full rounded-2xl bg-primary text-base font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSwitchingChain ? (
                  "Switching to Arc Mainnet..."
                ) : isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "Confirm Stake (Native USDC)"
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Rocket, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreateMarket } from "@/lib/hooks/use-create-market";
import { useAccount, useReadContract } from "wagmi";
import { CONVEX_MANAGER_ADDRESS, convexManagerAbi, CREATOR_ROLE } from "@/lib/contracts/convex-manager";

type Category = "Sports" | "Crypto" | "Culture";
type ResolutionMode = "manual" | "oracle";

type FormState = {
  question: string;
  category: Category;
  duration: string;
  entryAmount: number;
  resolution: ResolutionMode;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const categoryOptions: Array<{ value: Category; label: string; description: string }> = [
  {
    value: "Sports",
    label: "Sports",
    description: "Matches, player stats, and scorelines.",
  },
  {
    value: "Crypto",
    label: "Crypto",
    description: "Price targets, volatility, and token launches.",
  },
  {
    value: "Culture",
    label: "Culture",
    description: "Music drops, film premieres, and social trends.",
  },
];

const durationOptions = [
  { value: "2h", label: "2 hours", minutes: 120 },
  { value: "6h", label: "6 hours", minutes: 360 },
  { value: "24h", label: "24 hours", minutes: 1_440 },
  { value: "48h", label: "48 hours", minutes: 2_880 },
];

const resolutionOptions: Array<{ value: ResolutionMode; label: string; hint: string }> = [
  {
    value: "manual",
    label: "Manual (MVP)",
    hint: "You resolve the market from the Convex resolver workspace.",
  },
  {
    value: "oracle",
    label: "Oracle (coming soon)",
    hint: "Plug into Reality.eth or Witnet for automated resolution.",
  },
];

const entryPresets = [1, 5, 10, 25];

const defaultFormState: FormState = {
  question: "",
  category: "Sports",
  duration: "24h",
  entryAmount: 5,
  resolution: "manual",
};

export function CreateMarketCard() {
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { createMarket: createMarketOnChain, isPending, isSuccess: txSuccess, error: txError, marketId, storeMetadata } = useCreateMarket();

  const { data: hasCreatorRole } = useReadContract({
    address: CONVEX_MANAGER_ADDRESS,
    abi: convexManagerAbi,
    functionName: "hasRole",
    args: address ? [CREATOR_ROLE, address] : undefined,
    query: {
      enabled: Boolean(isConnected && address),
    },
  });

  useEffect(() => {
    if (txError) {
      setSubmitError(txError.message || "Transaction failed");
      setStatus("idle");
    }
  }, [txError]);

  useEffect(() => {
    if (txSuccess && status === "submitting" && marketId !== null && marketId !== undefined) {
      setStatus("success");

      // Store metadata in backend (don't block navigation if it fails)
      storeMetadata({
        question: formState.question.trim(),
        category: formState.category,
        resolutionSource: formState.resolution,
        marketId,
      })
        .then(() => {
          console.log(`✅ Market metadata stored for market #${marketId}`);
        })
        .catch((error) => {
          console.error("❌ Failed to store market metadata:", error);
          // Don't block navigation if metadata storage fails
        });

      // Redirect to market detail page after a short delay
      setTimeout(() => {
        router.push(`/market/${marketId}`);
      }, 1500);
    }
  }, [txSuccess, status, router, marketId, storeMetadata, formState.question, formState.category, formState.resolution]);

  const selectedDuration = useMemo(
    () => durationOptions.find((option) => option.value === formState.duration),
    [formState.duration]
  );

  const closingTimestamp = useMemo(() => {
    if (!selectedDuration) return null;
    const closingDate = new Date(Date.now() + selectedDuration.minutes * 60_000);
    return closingDate;
  }, [selectedDuration]);

  const closingLabel = useMemo(() => {
    if (!closingTimestamp) return null;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(closingTimestamp);
  }, [closingTimestamp]);

  const estimatedCreatorFee = useMemo(() => {
    const base = formState.entryAmount || 0;
    const projectedPool = base * 50; // assume 50 entrants for preview purposes
    return (projectedPool * 0.01).toFixed(2);
  }, [formState.entryAmount]);

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!formState.question.trim()) {
      nextErrors.question = "Describe the market clearly.";
    } else if (formState.question.trim().length < 12) {
      nextErrors.question = "Keep the question at least 12 characters long.";
    }

    if (!formState.duration) {
      nextErrors.duration = "Select how long the market stays open.";
    }

    if (!formState.entryAmount || formState.entryAmount < 1) {
      nextErrors.entryAmount = "Entry needs to be at least 1 USDC.";
    }

    if (formState.resolution === "oracle") {
      nextErrors.resolution = "Oracle flows ship after the hackathon.";
    }

    if (!closingTimestamp) {
      nextErrors.duration = "Select a closing window.";
    }

    return nextErrors;
  };

  const isSubmitting = status === "submitting" || isPending;
  const isSuccess = status === "success" || txSuccess;

  const isFormValid = useMemo(() => {
    const validation = validateForm();
    return Object.keys(validation).length === 0;
  }, [
    formState.entryAmount,
    formState.duration,
    formState.question,
    formState.resolution,
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateForm();
    setErrors(validation);
    setSubmitError(null);

    if (Object.keys(validation).length > 0) {
      return;
    }

    if (!closingTimestamp) {
      setSubmitError("Select a valid closing window.");
      return;
    }

    if (!isConnected) {
      setSubmitError("Please connect your wallet to create a market.");
      return;
    }

    if (hasCreatorRole === false) {
      setSubmitError("Connected wallet does not have CREATOR_ROLE on Arc Mainnet. Switch to the deployer account (0x4256...8018) or grant the role to this address.");
      return;
    }

    try {
      setStatus("submitting");
      await createMarketOnChain({
        question: formState.question.trim(),
        category: formState.category,
        closeTime: Math.floor(closingTimestamp.getTime() / 1000),
        entryAmount: formState.entryAmount || 5,
        resolutionSource: formState.resolution,
      });
    } catch (error) {
      console.error("Failed to create market:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to create market");
      setStatus("idle");
    }
  };

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#111827] sm:text-xl">Create a market</h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F7EF] px-3 py-1 text-xs font-semibold text-[#217756]">
          <Sparkles className="h-4 w-4" />
          Earn 1% creator fee
        </span>
      </div>

      <form className="mt-6" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.55fr)]">
          <div className="space-y-6">
            <div className="space-y-2">
          <label className="text-sm font-medium text-[#111827]" htmlFor="market-question">
            Market question
          </label>
          <textarea
            id="market-question"
            value={formState.question}
            onChange={(event) =>
              setFormState((current) => ({ ...current, question: event.target.value }))
            }
            placeholder="Will ETH close above $4k today?"
            rows={2}
            className={cn(
              "w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm text-[#111827] outline-none transition focus:border-[#35D07F] focus:bg-white focus:shadow-sm",
              errors.question && "border-[#F24E1E]"
            )}
          />
          {errors.question && (
            <p className="text-xs font-medium text-[#F24E1E]" role="alert">
              {errors.question}
            </p>
          )}
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[#111827]">Category</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {categoryOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() =>
                      setFormState((current) => ({ ...current, category: option.value }))
                    }
                    className={cn(
                      "rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-left transition hover:border-[#35D07F] hover:bg-[#F3F4F6]",
                      formState.category === option.value && "border-[#35D07F] bg-[#E9F7EF] !text-[#2A2C34]"
                    )}
                  >
                    <div className="text-sm font-semibold text-[#111827]" style={formState.category === option.value ? { color: "#2A2C34" } : undefined}>{option.label}</div>
                    <p className="mt-1 text-xs text-[#6B7280]" style={formState.category === option.value ? { color: "#40504d" } : undefined}>{option.description}</p>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="market-duration">
              Closing window
            </label>
            <div className="grid grid-cols-2 gap-2">
              {durationOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() =>
                    setFormState((current) => ({ ...current, duration: option.value }))
                  }
                  className={cn(
                    "rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-primary hover:bg-zinc-800 hover:text-white",
                    formState.duration === option.value && "border-[#35D07F] bg-[#E9F7EF] !text-[#2A2C34]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {errors.duration && (
              <p className="text-xs font-medium text-[#F24E1E]" role="alert">
                {errors.duration}
              </p>
            )}
            {closingLabel && (
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] px-4 py-3 text-xs text-[#4B5563]">
                <CalendarClock className="h-4 w-4 text-[#35D07F]" />
                Closes {closingLabel}
              </div>
            )}
              </div>

              <div className="space-y-2">
            <label className="text-sm font-medium text-[#111827]" htmlFor="entry-amount">
              Entry amount (USDC)
            </label>
            <div className="flex items-center rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3">
              <input
                id="entry-amount"
                type="number"
                min={1}
                step={1}
                value={formState.entryAmount}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    entryAmount: Number.parseInt(event.target.value, 10) || 0,
                  }))
                }
                className="w-full bg-transparent text-base font-semibold text-[#111827] outline-none ring-0"
              />
              <span className="text-sm font-semibold text-[#6B7280]">USDC</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {entryPresets.map((amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() =>
                    setFormState((current) => ({ ...current, entryAmount: amount }))
                  }
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition",
                    formState.entryAmount === amount
                      ? "bg-[#35D07F] text-white"
                      : "bg-[#F3F4F6] text-[#4B5563]"
                  )}
                >
                  {amount}
                </button>
              ))}
            </div>
            {errors.entryAmount && (
              <p className="text-xs font-medium text-[#F24E1E]" role="alert">
                {errors.entryAmount}
              </p>
            )}
            <p className="text-xs text-[#6B7280]">
              Users stake this amount per entry. Convex collects the configured protocol fee at resolution.
            </p>
          </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-[#111827]">Resolution method</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {resolutionOptions.map((option) => {
                  const isDisabled = option.value === "oracle";
                  const isActive = formState.resolution === option.value;
                  return (
                    <button
                      type="button"
                      key={option.value}
                      disabled={isDisabled}
                      onClick={() =>
                        setFormState((current) => ({ ...current, resolution: option.value }))
                      }
                      className={cn(
                        "rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-left text-zinc-100 transition hover:border-primary hover:bg-zinc-800 hover:text-white",
                        isActive && "border-[#35D07F] bg-[#E9F7EF] !text-[#2A2C34]",
                        isDisabled && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm font-semibold", isActive ? "text-[#2A2C34]" : "text-zinc-100")}>
                          {option.label}
                        </span>
                        {option.value === "manual" ? (
                          <Zap className="h-4 w-4 text-[#35D07F]" />
                        ) : (
                          <Rocket className="h-4 w-4 text-[#6B7280]" />
                        )}
                      </div>
                      <p className={cn("mt-1 text-xs", isActive ? "text-[#40504d]" : "text-muted-foreground")}>{option.hint}</p>
                    </button>
                  );
                })}
              </div>
              {errors.resolution && (
                <p className="text-xs font-medium text-[#F24E1E]" role="alert">
                  {errors.resolution}
                </p>
              )}
            </fieldset>

            {isConnected && hasCreatorRole === false && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
                <p className="font-semibold text-amber-800">Creator Role Required</p>
                <p className="mt-1">
                  Connected wallet <code className="font-mono text-amber-950 font-semibold">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}</code> does not currently have <code className="font-mono text-amber-950">CREATOR_ROLE</code> on Arc Mainnet.
                </p>
                <p className="mt-1">
                  To create markets, switch in MetaMask to the deployer account (<code className="font-mono text-amber-950 font-semibold">0x4256...8018</code>) or grant the role to this address:
                </p>
                <code className="mt-2 block rounded-lg bg-amber-100/80 p-2 font-mono text-[11px] text-amber-950 select-all overflow-x-auto whitespace-pre">
                  {`PowerShell: $env:WALLET_ADDRESS="${address}"; npx hardhat run scripts/grant-creator-role.ts --network arcMainnet\nBash: WALLET_ADDRESS=${address} npx hardhat run scripts/grant-creator-role.ts --network arcMainnet`}
                </code>
              </div>
            )}

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting || hasCreatorRole === false}
              className="w-full rounded-2xl bg-[#35D07F] text-base font-semibold text-white hover:bg-[#29b46e] disabled:cursor-not-allowed disabled:bg-opacity-60"
            >
              {isSubmitting ? "Preparing market..." : hasCreatorRole === false ? "Creator Role Required" : "Preview & launch"}
            </Button>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-5 text-sm text-[#4B5563]">
              <div className="flex items-center justify-between text-[#111827]">
                <span className="text-sm font-semibold">Launch summary</span>
                <span className="text-xs font-semibold text-[#217756]">Creator earns 1%</span>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-[#4B5563]">
                <li>• Market closes {closingLabel ?? "after your selected window"}.</li>
                <li>• Winners can claim instantly from their wallet post-resolution.</li>
                <li>• Estimated creator fee on 50 entries: {estimatedCreatorFee} USDC.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                Preview
              </p>
              <div className="mt-3 space-y-3">
                <p className="text-sm font-semibold text-[#111827]">
                  {formState.question || "Your market question appears here."}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#4B5563]">
                  <span className="rounded-full bg-[#E9F7EF] px-3 py-1 font-semibold text-[#217756]">
                    {formState.category}
                  </span>
                  {closingLabel && (
                    <span className="rounded-full bg-[#F3F4F6] px-3 py-1">
                      Closes {closingLabel}
                    </span>
                  )}
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                  <div className="flex items-center justify-between text-xs text-[#6B7280]">
                    <span>Entry</span>
                    <span className="font-semibold text-[#111827]">{formState.entryAmount} USDC</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" className="rounded-2xl bg-[#35D07F] py-2 text-sm font-semibold text-white">
                      Yes
                    </button>
                    <button type="button" className="rounded-2xl border border-[#E5E7EB] bg-white py-2 text-sm font-semibold text-[#111827]">
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-6 min-h-[20px]" aria-live="polite" role="status">
          {submitError && (
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#991B1B]">
              {submitError}
            </div>
          )}
          {isSuccess && (
            <div className="rounded-2xl border border-[#DCFCE7] bg-[#F0FDF4] px-4 py-3 text-sm font-medium text-[#166534]">
              Market created on-chain. Redirecting to detail view...
            </div>
          )}
        </div>
      </form>
    </section>
  );
}



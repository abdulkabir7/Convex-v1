import { Container } from "@/components/layout/container";
import { HeroIllustration } from "@/components/home/hero-illustration";
import { MarketGallery } from "@/components/markets/market-gallery";
import { fetchMarkets } from "@/lib/api/markets";
import { ArrowRight, CircleDollarSign, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

// Revalidate every 10 seconds to get fresh market data
export const revalidate = 10;

export default async function Home() {
  const markets = await fetchMarkets();

  return (
    <main className="arc-grid min-h-screen pb-24 pt-8 sm:pt-12">
      <Container className="space-y-10 lg:space-y-14">
        <section className="glass-panel relative grid overflow-hidden rounded-3xl p-6 sm:p-10 lg:min-h-[520px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-4 lg:p-8 xl:p-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative z-10 max-w-2xl py-3 lg:py-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              <Zap className="h-3.5 w-3.5" /> Arc-native prediction markets
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl xl:text-7xl">
              Make the call.<br /><span className="text-primary">Back it on Arc.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Trade conviction across crypto, sports, and the stories shaping tomorrow. Native USDC powers both stakes and gas, so every bet is one clean wallet confirmation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/markets" className="inline-flex items-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90">
                Explore live markets <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-secondary/50 px-4 py-3 text-sm text-zinc-300">
                <CircleDollarSign className="h-4 w-4 text-primary" /> 1 USDC minimum
              </div>
            </div>
          </div>
          <div className="relative -mx-2 -mb-3 mt-5 sm:mx-0 lg:my-0 lg:-mr-5">
            <HeroIllustration />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p className="text-sm font-medium text-emerald-100">Native USDC powers both stakes and gas fees.</p>
          </div>
          <p className="text-xs text-emerald-300">Zero approval transactions · 1-click betting</p>
        </section>

        <section id="explore" className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">The board</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Where conviction is moving</h2>
            </div>
            <Link href="/markets" className="hidden items-center text-sm font-semibold text-primary hover:text-emerald-300 sm:flex">View all <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </div>
          <MarketGallery markets={markets} enableCategoryFilter={false} />
        </section>
      </Container>
    </main>
  );
}

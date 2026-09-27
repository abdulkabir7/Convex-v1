import { ArrowUpRight, CircleDollarSign, TrendingUp } from "lucide-react";

const predictions = [
  { question: "Will BTC clear $100K?", yes: 72, no: 28 },
  { question: "Will SOL reach $300?", yes: 61, no: 39 },
];

export function HeroIllustration() {
  return (
    <div
      aria-label="Native USDC coin surrounded by live prediction markets"
      role="img"
      className="relative mx-auto h-[330px] w-full max-w-[620px] overflow-hidden sm:h-[420px] lg:h-[470px]"
    >
      <div className="absolute inset-4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(7,149,95,0.22),transparent_68%)]" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent shadow-[0_0_24px_8px_rgba(16,185,129,0.2)]" />
      <div className="absolute inset-x-8 top-[47%] h-24 -rotate-6 rounded-[50%] border border-emerald-400/20 shadow-[0_0_24px_rgba(16,185,129,0.18)]" />
      <div className="absolute inset-x-2 top-[53%] h-20 rotate-3 rounded-[50%] border border-teal-300/20" />

      <div className="absolute left-1/2 top-[48%] z-20 aspect-square h-[64%] -translate-x-1/2 -translate-y-1/2 [perspective:900px]">
        <div className="absolute inset-y-4 right-0 w-[12%] translate-x-3 rounded-r-full border-y border-r border-emerald-200/40 bg-gradient-to-r from-emerald-800 via-emerald-950 to-zinc-950 shadow-[12px_14px_22px_rgba(0,0,0,0.45)]" />
        <div className="absolute inset-0 rounded-full border border-emerald-100/70 bg-gradient-to-br from-emerald-100 via-emerald-500 to-emerald-950 p-[3%] shadow-[0_0_55px_rgba(16,185,129,0.42),0_26px_55px_rgba(0,0,0,0.5)] [transform:rotateY(-13deg)_rotateX(8deg)]">
          <div className="flex h-full w-full items-center justify-center rounded-full border border-emerald-100/60 bg-[radial-gradient(circle_at_35%_28%,#bbf7d0_0%,#10b981_23%,#047857_58%,#022c22_100%)] shadow-[inset_0_0_0_9px_rgba(2,44,34,0.4),inset_0_0_32px_rgba(167,243,208,0.3)]">
            <div className="absolute inset-[10%] rounded-full border border-emerald-100/40" />
            <div className="absolute inset-[14%] rounded-full border border-emerald-950/30" />
            <CircleDollarSign className="relative h-[48%] w-[48%] text-emerald-50 drop-shadow-[0_5px_2px_rgba(0,0,0,0.38)]" strokeWidth={1.35} />
          </div>
        </div>
      </div>

      {predictions.map((prediction, index) => (
        <article
          key={prediction.question}
          className={`absolute z-30 w-[46%] max-w-[210px] rounded-2xl border border-emerald-300/25 bg-zinc-950/75 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.36)] backdrop-blur-md sm:w-[42%] sm:p-4 ${
            index === 0 ? "left-0 top-[15%] -rotate-2" : "right-0 top-[24%] rotate-2"
          }`}
        >
          <div className="flex items-start gap-2">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-xs font-semibold leading-snug text-zinc-100 sm:text-sm">{prediction.question}</p>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] sm:text-xs">
            <div className="flex items-center justify-between rounded-full bg-emerald-500/25 px-2.5 py-1.5 text-emerald-100">
              <span>Yes</span>
              <span className="font-bold text-emerald-300">{prediction.yes}%</span>
            </div>
            <div className="flex items-center justify-between rounded-full bg-zinc-800/90 px-2.5 py-1.5 text-zinc-400">
              <span>No</span>
              <span className="font-semibold">{prediction.no}%</span>
            </div>
          </div>
        </article>
      ))}

      <div className="absolute bottom-[7%] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-300/25 bg-zinc-950/80 px-3 py-2 text-[11px] font-semibold text-emerald-100 shadow-lg backdrop-blur sm:text-xs">
        <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.9)]" />
        Native USDC · Arc Mainnet
        <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
      </div>
    </div>
  );
}

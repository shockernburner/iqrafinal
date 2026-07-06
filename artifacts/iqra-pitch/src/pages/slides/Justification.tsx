export default function Justification() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Justification
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          The raise funds a clear path from live product to recurring revenue
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center gap-[2.4vh]">
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            ~24 months of runway to hit the milestones investors underwrite.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Funds the jump from 400+ to 100,000 authenticated sources — the core defensibility.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Targets a ~40% reduction in cost per query as knowledge confidence rises.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Stands up the B2B API alpha that opens high-margin recurring revenue in Year 2+.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Right-sized: enough to reach scale and B2B, small enough to keep the round efficient.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">11 / 12</p>
      </footer>
    </div>
  );
}

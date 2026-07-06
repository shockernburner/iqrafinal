export default function ExecutiveSummary() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Executive Summary
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          IQRA is a live, source-grounded Islamic assistant raising $2.5M to reach scale
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center gap-[2.1vh]">
        <div className="flex items-baseline gap-[2vw]">
          <span className="font-display font-bold text-[2.3vw] text-accent w-[4vw] shrink-0">01</span>
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[86%]">
            General AI answers faith questions probabilistically, producing unverifiable rulings.
          </p>
        </div>
        <div className="flex items-baseline gap-[2vw]">
          <span className="font-display font-bold text-[2.3vw] text-accent w-[4vw] shrink-0">02</span>
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[86%]">
            IQRA is a live assistant that anchors every answer in authenticated sources and a verified chain of transmission (Isnad).
          </p>
        </div>
        <div className="flex items-baseline gap-[2vw]">
          <span className="font-display font-bold text-[2.3vw] text-accent w-[4vw] shrink-0">03</span>
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[86%]">
            The market: 2 billion Muslims and a $2.4 trillion Islamic economy.
          </p>
        </div>
        <div className="flex items-baseline gap-[2vw]">
          <span className="font-display font-bold text-[2.3vw] text-accent w-[4vw] shrink-0">04</span>
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[86%]">
            The model scales from donations to premium tooling to B2B licensing.
          </p>
        </div>
        <div className="flex items-baseline gap-[2vw]">
          <span className="font-display font-bold text-[2.3vw] text-accent w-[4vw] shrink-0">05</span>
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[86%]">
            The ask: $2.5M to reach 1M daily users and B2B revenue within 24 months.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">02 / 12</p>
      </footer>
    </div>
  );
}

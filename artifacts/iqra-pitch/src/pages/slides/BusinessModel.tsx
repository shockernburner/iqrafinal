export default function BusinessModel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[7vh] pb-[5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Business Model
        </p>
        <h2 className="mt-[1.4vh] font-display font-bold text-[3.3vw] leading-[1.08] tracking-tight text-primary max-w-[88%] text-balance">
          Revenue scales from donations to premium tooling to B2B licensing
        </h2>
        <div className="mt-[2.2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-[3vw] items-start">
          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <p className="font-body font-semibold text-[2.1vw] tracking-[0.14em] uppercase text-accent">Phase 1</p>
            <h3 className="mt-[1.2vh] font-display font-semibold text-[2.7vw] leading-tight text-primary">Philanthropy</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              In-app donations fund operations today.
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <p className="font-body font-semibold text-[2.1vw] tracking-[0.14em] uppercase text-accent">Phase 2</p>
            <h3 className="mt-[1.2vh] font-display font-semibold text-[2.7vw] leading-tight text-primary">Premium tooling</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              Zakat calculator, Halal investment checklist, estate planning, corporate Zakat audits.
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <p className="font-body font-semibold text-[2.1vw] tracking-[0.14em] uppercase text-accent">Phase 3 · Year 2+</p>
            <h3 className="mt-[1.2vh] font-display font-semibold text-[2.7vw] leading-tight text-primary">B2B licensing</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              API access and compliance chatbots for Halal marketplaces and institutions.
            </p>
          </div>
        </div>

        <p className="mt-[5vh] font-body text-[2.3vw] leading-[1.32] text-text/80 max-w-[92%]">
          Cost per query targeted to fall ~40% over 12 months as knowledge confidence rises (management target).
        </p>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">07 / 12</p>
      </footer>
    </div>
  );
}

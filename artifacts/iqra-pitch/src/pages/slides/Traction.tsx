export default function Traction() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Traction
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          A working product already answers grounded questions today
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center">
        <div className="grid grid-cols-[1fr_30vw] border-b-2 border-primary/30 pb-[1.2vh]">
          <p className="font-body font-semibold text-[2.2vw] tracking-[0.12em] uppercase text-muted">Built</p>
          <p className="font-body font-semibold text-[2.2vw] tracking-[0.12em] uppercase text-muted">Status</p>
        </div>

        <div className="grid grid-cols-[1fr_30vw] items-center py-[1.7vh] border-b border-primary/12">
          <p className="font-body text-[2.35vw] leading-[1.25] text-text/90 pr-[3vw]">
            Live web app + installable PWA, secure accounts, multi-thread chat
          </p>
          <p className="font-body font-semibold text-[2.3vw] text-primary">Live at iqra.live</p>
        </div>
        <div className="grid grid-cols-[1fr_30vw] items-center py-[1.7vh] border-b border-primary/12">
          <p className="font-body text-[2.35vw] leading-[1.25] text-text/90 pr-[3vw]">
            Knowledge base of 400+ classical source documents (~58,000 searchable passages)
          </p>
          <p className="font-body font-semibold text-[2.3vw] text-primary">Ingested</p>
        </div>
        <div className="grid grid-cols-[1fr_30vw] items-center py-[1.7vh] border-b border-primary/12">
          <p className="font-body text-[2.35vw] leading-[1.25] text-text/90 pr-[3vw]">
            500 curated scholar-style Q&amp;A pairs guiding answer quality
          </p>
          <p className="font-body font-semibold text-[2.3vw] text-primary">Active</p>
        </div>
        <div className="grid grid-cols-[1fr_30vw] items-center py-[1.7vh] border-b border-primary/12">
          <p className="font-body text-[2.35vw] leading-[1.25] text-text/90 pr-[3vw]">
            Donations, admin knowledge management, growth analytics
          </p>
          <p className="font-body font-semibold text-[2.3vw] text-primary">Operational</p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">05 / 12</p>
      </footer>
    </div>
  );
}

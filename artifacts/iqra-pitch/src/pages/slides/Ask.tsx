export default function Ask() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          The Ask
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[90%] text-balance">
          We are raising $2.5M to reach one million users and B2B revenue in 24 months
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center">
        <div className="grid grid-cols-[36vw_1fr_9vw] items-center gap-[2.5vw] py-[1.2vh] border-b border-primary/12">
          <p className="font-body text-[2.3vw] text-text/90">Knowledge &amp; Isnad Board</p>
          <div className="h-[1.4vh] w-full bg-primary/10"><div className="h-full bg-accent w-[30%]" /></div>
          <p className="font-body font-semibold text-[2.4vw] text-primary text-right">30%</p>
        </div>
        <div className="grid grid-cols-[36vw_1fr_9vw] items-center gap-[2.5vw] py-[1.2vh] border-b border-primary/12">
          <p className="font-body text-[2.3vw] text-text/90">Engineering &amp; AI infrastructure</p>
          <div className="h-[1.4vh] w-full bg-primary/10"><div className="h-full bg-accent w-[30%]" /></div>
          <p className="font-body font-semibold text-[2.4vw] text-primary text-right">30%</p>
        </div>
        <div className="grid grid-cols-[36vw_1fr_9vw] items-center gap-[2.5vw] py-[1.2vh] border-b border-primary/12">
          <p className="font-body text-[2.3vw] text-text/90">Product (premium tooling + B2B API alpha)</p>
          <div className="h-[1.4vh] w-full bg-primary/10"><div className="h-full bg-accent w-[20%]" /></div>
          <p className="font-body font-semibold text-[2.4vw] text-primary text-right">20%</p>
        </div>
        <div className="grid grid-cols-[36vw_1fr_9vw] items-center gap-[2.5vw] py-[1.2vh] border-b border-primary/12">
          <p className="font-body text-[2.3vw] text-text/90">Growth &amp; community</p>
          <div className="h-[1.4vh] w-full bg-primary/10"><div className="h-full bg-accent w-[15%]" /></div>
          <p className="font-body font-semibold text-[2.4vw] text-primary text-right">15%</p>
        </div>
        <div className="grid grid-cols-[36vw_1fr_9vw] items-center gap-[2.5vw] py-[1.2vh] border-b border-primary/12">
          <p className="font-body text-[2.3vw] text-text/90">Reserve</p>
          <div className="h-[1.4vh] w-full bg-primary/10"><div className="h-full bg-accent w-[5%]" /></div>
          <p className="font-body font-semibold text-[2.4vw] text-primary text-right">5%</p>
        </div>

        <div className="mt-[2.4vh] space-y-[1vh]">
          <p className="font-body text-[2.2vw] leading-[1.28] text-text/90">
            <span className="font-semibold text-primary">Indicative terms:</span> $2.5M seed for ~15% equity (~$16.7M post-money), via SAFE or priced round.
          </p>
          <p className="font-body text-[2.2vw] leading-[1.28] text-text/90">
            <span className="font-semibold text-primary">Values-aligned capital only:</span> partners uphold the Zero Comparative Religion policy and Isnad Board independence.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">10 / 12</p>
      </footer>
    </div>
  );
}

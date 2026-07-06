export default function Expansion() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[7vh] pb-[5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Expansion
        </p>
        <h2 className="mt-[1.4vh] font-display font-bold text-[3.3vw] leading-[1.08] tracking-tight text-primary max-w-[88%] text-balance">
          Expansion advances across knowledge, language, and market
        </h2>
        <div className="mt-[2.2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-[3vw] items-start">
          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <h3 className="font-display font-semibold text-[2.7vw] leading-tight text-primary">Knowledge</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              From 400+ documents toward 100,000 authenticated primary sources via library partnerships.
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <h3 className="font-display font-semibold text-[2.7vw] leading-tight text-primary">Language</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              Extend beyond English to Arabic, Urdu, and Bahasa — 60% of Muslims live in Asia-Pacific.
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <h3 className="font-display font-semibold text-[2.7vw] leading-tight text-primary">Market</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              Consumer app first, then B2B API and compliance tooling for the Halal economy.
            </p>
          </div>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">Source: Pew Research Center (regional distribution).</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">09 / 12</p>
      </footer>
    </div>
  );
}

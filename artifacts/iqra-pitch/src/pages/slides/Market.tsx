export default function Market() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[7vh] pb-[5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Market
        </p>
        <h2 className="mt-[1.4vh] font-display font-bold text-[3.3vw] leading-[1.08] tracking-tight text-primary max-w-[88%] text-balance">
          Two billion Muslims anchor a $2.4 trillion Islamic economy
        </h2>
        <div className="mt-[2.2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-[4vw]">
          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <p className="font-display font-bold text-[3.1vw] leading-none text-primary">
              2.0B <span className="text-accent">→</span> 2.2B
            </p>
            <p className="mt-[2vh] font-body text-[2.4vw] leading-[1.3] text-text/85">
              Muslims worldwide, 2025 → 2030
            </p>
            <p className="mt-[1vh] font-body text-[2.2vw] text-muted">
              Growing ~2x the global rate
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <p className="font-display font-bold text-[3.1vw] leading-none text-primary">
              $2.43T <span className="text-accent">→</span> $3.36T
            </p>
            <p className="mt-[2vh] font-body text-[2.4vw] leading-[1.3] text-text/85">
              Muslim consumer spending, 2023 → 2028
            </p>
            <p className="mt-[1vh] font-body text-[2.2vw] text-muted">
              Across core halal sectors
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <p className="font-display font-bold text-[3.1vw] leading-none text-primary">
              $4.9T <span className="text-accent">→</span> $7.5T
            </p>
            <p className="mt-[2vh] font-body text-[2.4vw] leading-[1.3] text-text/85">
              Islamic finance assets, 2023 → 2028
            </p>
            <p className="mt-[1vh] font-body text-[2.2vw] text-muted">
              Deep, compounding capital base
            </p>
          </div>
        </div>

        <p className="mt-[5vh] font-body text-[2.5vw] leading-[1.32] text-text/90 max-w-[90%]">
          Near-term wedge: the 1B+ Muslims already online and underserved by authentic tools.
        </p>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[74%]">
          Sources: Pew Research Center (2025); DinarStandard, State of the Global Islamic Economy 2024/25; Standard Chartered.
        </p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">06 / 12</p>
      </footer>
    </div>
  );
}

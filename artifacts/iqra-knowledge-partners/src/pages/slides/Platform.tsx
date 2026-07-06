export default function Platform() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          What IQRA Is
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[90%] text-balance">
          A governed platform that preserves sources and answers from them
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center gap-[3vh]">
        <div className="grid grid-cols-3 gap-[3vw]">
          <div>
            <p className="font-display font-bold text-[3.4vw] leading-none text-primary">Live</p>
            <p className="mt-[1.4vh] font-body text-[2.2vw] leading-[1.28] text-text/85">
              A working assistant at iqra.live, answering grounded questions today.
            </p>
          </div>
          <div>
            <p className="font-display font-bold text-[3.4vw] leading-none text-primary">Governed</p>
            <p className="mt-[1.4vh] font-body text-[2.2vw] leading-[1.28] text-text/85">
              An Isnad Board of verified scholars decides what enters the knowledge base.
            </p>
          </div>
          <div>
            <p className="font-display font-bold text-[3.4vw] leading-none text-primary">Grounded</p>
            <p className="mt-[1.4vh] font-body text-[2.2vw] leading-[1.28] text-text/85">
              Every answer ties back to a source and is tagged with its scriptural anchor.
            </p>
          </div>
        </div>

        <p className="font-body text-[2.4vw] leading-[1.3] text-text/90 max-w-[90%]">
          The knowledge base already holds 400+ classical documents. Your sources become answers that carry their attribution wherever they travel.
        </p>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">02 / 07</p>
      </footer>
    </div>
  );
}

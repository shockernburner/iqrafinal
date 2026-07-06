export default function Solution() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Solution
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          IQRA anchors every answer in authenticated sources and scholarly governance
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center gap-[2.4vh]">
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Retrieval-grounded assistant: every answer ties back to classical texts, not model guesswork.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Five knowledge domains: creed, jurisprudence of transactions, hadith authentication, ethics, and history.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            An Isnad Board of verified scholars governs ingestion so no synthetic or plagiarized content enters the base.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Zero Comparative Religion policy and a total ban on optimizing Haram activity — guardrails built in, not bolted on.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.4vw] leading-[1.28] text-text/90 max-w-[88%]">
            Every answer is tagged with its scriptural anchor so users can verify the source.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">04 / 12</p>
      </footer>
    </div>
  );
}

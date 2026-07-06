export default function Safeguards() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Our Commitments
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          Safeguards that protect your work and the tradition
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center gap-[2.6vh]">
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.45vw] leading-[1.28] text-text/90 max-w-[88%]">
            Copyright respected: sources are used only under clear, agreed terms with rights holders.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.45vw] leading-[1.28] text-text/90 max-w-[88%]">
            No synthetic content: nothing enters the base without scholarly review and provenance.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.45vw] leading-[1.28] text-text/90 max-w-[88%]">
            Scholarly oversight: the Isnad Board governs the knowledge base and stays independent.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.45vw] leading-[1.28] text-text/90 max-w-[88%]">
            Zero Comparative Religion: IQRA never debates or ranks faiths — it teaches within the tradition.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">06 / 07</p>
      </footer>
    </div>
  );
}

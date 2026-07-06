export default function Mission() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Our Mission
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          Authentic knowledge deserves to reach the people who seek it
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center gap-[2.8vh]">
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.5vw] leading-[1.3] text-text/90 max-w-[88%]">
            Classical Islamic scholarship is vast, rigorous, and precious — yet much of it sits in archives few can access.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.5vw] leading-[1.3] text-text/90 max-w-[88%]">
            More people now turn to general AI for religious guidance and receive answers no scholar has verified.
          </p>
        </div>
        <div className="flex items-start gap-[1.8vw]">
          <div className="mt-[1vh] h-[1vw] w-[1vw] shrink-0 bg-accent" />
          <p className="font-body text-[2.5vw] leading-[1.3] text-text/90 max-w-[88%]">
            IQRA exists to carry the authenticated tradition into that space — with its chain of transmission intact.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">01 / 07</p>
      </footer>
    </div>
  );
}

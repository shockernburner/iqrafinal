export default function Process() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          How It Works
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          From source to verified answer in three steps
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-3 gap-[3vw] content-center">
        <div className="flex flex-col">
          <span className="font-display font-bold text-[4.5vw] leading-none text-accent">01</span>
          <p className="mt-[1.6vh] font-display font-bold text-[2.5vw] text-primary">Contribute</p>
          <p className="mt-[1vh] font-body text-[2.2vw] leading-[1.3] text-text/85">
            You share texts or grant access. We handle digitization and structuring.
          </p>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-[4.5vw] leading-none text-accent">02</span>
          <p className="mt-[1.6vh] font-display font-bold text-[2.5vw] text-primary">Authenticate</p>
          <p className="mt-[1vh] font-body text-[2.2vw] leading-[1.3] text-text/85">
            The Isnad Board reviews each source before it can inform any answer.
          </p>
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-[4.5vw] leading-none text-accent">03</span>
          <p className="mt-[1.6vh] font-display font-bold text-[2.5vw] text-primary">Attribute</p>
          <p className="mt-[1vh] font-body text-[2.2vw] leading-[1.3] text-text/85">
            Answers cite your source by name, preserving credit and provenance.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">04 / 07</p>
      </footer>
    </div>
  );
}

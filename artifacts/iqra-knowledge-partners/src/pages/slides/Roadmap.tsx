export default function Roadmap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          The Road Ahead
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          From hundreds of sources toward a preserved library
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 flex flex-col justify-center gap-[3.4vh]">
        <div className="grid grid-cols-2 gap-[5vw] items-baseline">
          <div>
            <p className="font-display font-bold text-[5.5vw] leading-none text-primary">400+</p>
            <p className="mt-[1.4vh] font-body text-[2.3vw] leading-[1.28] text-text/85">
              Authenticated documents in the knowledge base today.
            </p>
          </div>
          <div>
            <p className="font-display font-bold text-[5.5vw] leading-none text-accent">100,000</p>
            <p className="mt-[1.4vh] font-body text-[2.3vw] leading-[1.28] text-text/85">
              The goal: a deep, primary-source library built with partners.
            </p>
          </div>
        </div>

        <p className="font-body text-[2.4vw] leading-[1.3] text-text/90 max-w-[90%]">
          Alongside scale, we expand into Arabic, Urdu, and Bahasa — so authentic scholarship reaches the languages most Muslims read.
        </p>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">07 / 07</p>
      </footer>
    </div>
  );
}

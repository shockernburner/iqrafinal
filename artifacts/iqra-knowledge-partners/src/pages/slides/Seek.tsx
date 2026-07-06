export default function Seek() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[6vh] pb-[4.5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Who We Seek
        </p>
        <h2 className="mt-[1.2vh] font-display font-bold text-[3.2vw] leading-[1.06] tracking-tight text-primary max-w-[88%] text-balance">
          Partners who hold and steward authentic sources
        </h2>
        <div className="mt-[2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 min-h-0 grid grid-cols-2 gap-x-[5vw] gap-y-[3.2vh] content-center">
        <div>
          <p className="font-display font-bold text-[2.7vw] text-primary">Libraries &amp; archives</p>
          <p className="mt-[1vh] font-body text-[2.2vw] leading-[1.28] text-text/85">
            Manuscript collections and digitized classical texts seeking wider, respectful reach.
          </p>
        </div>
        <div>
          <p className="font-display font-bold text-[2.7vw] text-primary">Scholars &amp; teachers</p>
          <p className="mt-[1vh] font-body text-[2.2vw] leading-[1.28] text-text/85">
            Verified experts to sit on the Isnad Board and vouch for what is authentic.
          </p>
        </div>
        <div>
          <p className="font-display font-bold text-[2.7vw] text-primary">Publishers</p>
          <p className="mt-[1vh] font-body text-[2.2vw] leading-[1.28] text-text/85">
            Rights holders of translations and commentaries, licensed on clear, fair terms.
          </p>
        </div>
        <div>
          <p className="font-display font-bold text-[2.7vw] text-primary">Institutions</p>
          <p className="mt-[1vh] font-body text-[2.2vw] leading-[1.28] text-text/85">
            Universities, seminaries, and endowments committed to preserving the tradition.
          </p>
        </div>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">03 / 07</p>
      </footer>
    </div>
  );
}

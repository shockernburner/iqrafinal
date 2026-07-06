export default function Growth() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg text-text font-body flex flex-col px-[8vw] pt-[7vh] pb-[5vh]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-primary/90" />

      <header>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-accent">
          Growth
        </p>
        <h2 className="mt-[1.4vh] font-display font-bold text-[3.3vw] leading-[1.08] tracking-tight text-primary max-w-[88%] text-balance">
          Reaching one million daily users runs on three growth engines
        </h2>
        <div className="mt-[2.2vh] h-[0.4vh] w-[7vw] bg-accent" />
      </header>

      <main className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-3 gap-[3vw] items-start">
          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <h3 className="font-display font-semibold text-[2.7vw] leading-tight text-primary">Community</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              Mosque, university, and scholar networks; shareable, source-cited answers.
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <h3 className="font-display font-semibold text-[2.7vw] leading-tight text-primary">Product depth</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              Premium tools convert engaged users; PWA install lowers friction.
            </p>
          </div>

          <div className="border-t-2 border-primary/25 pt-[2.2vh]">
            <h3 className="font-display font-semibold text-[2.7vw] leading-tight text-primary">Partnerships</h3>
            <p className="mt-[1.8vh] font-body text-[2.35vw] leading-[1.38] text-text/85">
              Islamic institutions and libraries drive credibility and distribution.
            </p>
          </div>
        </div>

        <p className="mt-[5vh] font-body text-[2.3vw] leading-[1.32] text-text/80 max-w-[92%]">
          Milestone path: live product → engaged base → 1M daily users as the funded 24-month goal (target, not current).
        </p>
      </main>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-muted/80 max-w-[72%]">&nbsp;</p>
        <p className="font-body text-[2.2vw] tracking-[0.25em] text-muted/70">08 / 12</p>
      </footer>
    </div>
  );
}

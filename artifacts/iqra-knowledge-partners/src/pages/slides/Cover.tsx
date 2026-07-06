export default function Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body flex flex-col justify-between px-[8vw] py-[9vh] bg-[#0e3823] text-[#f4efe3]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-[#c69a3e]" />

      <header className="flex items-center justify-between">
        <p className="font-display font-bold text-[3vw] tracking-[0.35em] text-[#f4efe3]">
          IQRA
        </p>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-[#c69a3e]">
          Knowledge Partnership
        </p>
      </header>

      <div className="max-w-[80%]">
        <h1 className="font-display font-bold text-[6vw] leading-[1.02] tracking-tight text-[#f4efe3] text-balance">
          Preserving authentic scholarship for a global generation
        </h1>
        <div className="mt-[3vh] h-[0.5vh] w-[12vw] bg-[#c69a3e]" />
      </div>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.2vw] text-[#f4efe3]/70">
          A proposal for libraries, scholars &amp; institutions
        </p>
        <p className="font-body text-[2.2vw] tracking-[0.2em] text-[#f4efe3]/50">
          iqra.live
        </p>
      </footer>
    </div>
  );
}

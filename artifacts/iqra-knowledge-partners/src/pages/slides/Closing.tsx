export default function Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden font-body flex flex-col justify-between px-[8vw] py-[9vh] bg-[#0e3823] text-[#f4efe3]">
      <div className="absolute top-0 left-0 h-[0.6vh] w-full bg-[#c69a3e]" />

      <header className="flex items-center justify-between">
        <p className="font-display font-bold text-[2.6vw] tracking-[0.35em] text-[#f4efe3]">
          IQRA
        </p>
        <p className="font-body font-semibold text-[2.2vw] tracking-[0.3em] uppercase text-[#c69a3e]">
          Partner With Us
        </p>
      </header>

      <div className="max-w-[82%]">
        <h2 className="font-display font-bold text-[4.6vw] leading-[1.05] tracking-tight text-[#f4efe3] text-balance">
          Let us carry your scholarship to those who seek it
        </h2>
        <div className="mt-[3vh] h-[0.5vh] w-[12vw] bg-[#c69a3e]" />
        <p className="mt-[3vh] font-body text-[2.4vw] leading-[1.35] text-[#f4efe3]/85 max-w-[85%]">
          If your institution stewards authentic sources, we would be honored to talk.
        </p>
      </div>

      <footer className="flex items-end justify-between">
        <p className="font-body text-[2.3vw] text-[#c69a3e]">
          partner@iqra.live
        </p>
        <p className="font-body text-[2.2vw] tracking-[0.2em] text-[#f4efe3]/50">
          iqra.live
        </p>
      </footer>
    </div>
  );
}

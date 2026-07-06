export default function Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0e3823] text-[#f4efe3] font-body flex flex-col justify-between px-[8vw] py-[9vh]">
      <div className="absolute top-0 left-0 h-[0.7vh] w-full bg-[#c69a3e]" />

      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-[3vw] tracking-[0.4em] text-[#f4efe3]">
          IQRA
        </p>
        <p className="font-body text-[2.2vw] tracking-[0.32em] uppercase text-[#c69a3e]">
          Confidential
        </p>
      </div>

      <div className="max-w-[84%]">
        <h1 className="font-display font-bold text-[5.2vw] leading-[1.05] tracking-tight text-balance">
          Investing in the integrity of Islamic knowledge
        </h1>
        <div className="mt-[3.5vh] h-[0.45vh] w-[11vw] bg-[#c69a3e]" />
        <p className="mt-[3.5vh] font-body text-[2.6vw] leading-[1.32] text-[#f4efe3]/85 max-w-[80%]">
          The defensible position in authenticated Islamic AI.
        </p>
      </div>

      <div className="flex items-end justify-between">
        <p className="font-body text-[2.4vw] text-[#f4efe3]/85">
          iqra.live · invest@iqra.live
        </p>
        <p className="font-body text-[2.3vw] tracking-[0.2em] text-[#f4efe3]/60">
          Seed round · 2026
        </p>
      </div>
    </div>
  );
}

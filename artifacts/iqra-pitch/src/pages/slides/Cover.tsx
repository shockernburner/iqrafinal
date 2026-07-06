export default function Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0e3823] text-[#f4efe3] font-body flex flex-col justify-between px-[8vw] py-[9vh]">
      <div className="absolute top-0 left-0 h-[0.7vh] w-full bg-[#c69a3e]" />

      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-[3vw] tracking-[0.4em] text-[#f4efe3]">
          IQRA
        </p>
        <p className="font-body text-[2.2vw] tracking-[0.32em] uppercase text-[#c69a3e]">
          Investment Proposal
        </p>
      </div>

      <div className="max-w-[82%]">
        <h1 className="font-display font-bold text-[5.6vw] leading-[1.04] tracking-tight text-balance">
          Authenticated Islamic knowledge for the age of generative AI
        </h1>
        <div className="mt-[4vh] h-[0.45vh] w-[11vw] bg-[#c69a3e]" />
      </div>

      <div className="flex items-end justify-between">
        <p className="font-body text-[2.4vw] text-[#f4efe3]/85">
          Seed round · 2026 · Confidential
        </p>
        <p className="font-body text-[2.3vw] tracking-[0.2em] text-[#f4efe3]/60">
          iqra.live
        </p>
      </div>
    </div>
  );
}

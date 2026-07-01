"use client";

import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";

type Props = {
  onClose: () => void;
};

const criteria = [
  "No interest-bearing revenue or financing core",
  "No Haram industry exposure",
  "Terms are transparent and documented",
  "Profit and loss exposure is genuine",
  "No excessive uncertainty or hidden penalties",
  "Underlying activity creates lawful value",
];

export function HalalChecklist({ onClose }: Props) {
  const [checked, setChecked] = useState<boolean[]>([true, true, true, false, true, true]);
  const gaps = criteria.filter((_, index) => !checked[index]);
  const compliant = gaps.length === 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-md border border-[#E5E5E5] bg-white p-5 text-[#444444] shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Halal investment checklist</h2>
            <p className="mt-1 text-sm text-[#666666]">Toggle each screening condition to produce a live verdict.</p>
          </div>
          <button aria-label="Close Halal checklist" className="rounded-md border border-[#E5E5E5] p-2" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-2">
          {criteria.map((criterion, index) => (
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3 text-sm" key={criterion}>
              <input checked={checked[index]} className="h-4 w-4 accent-[#D4AF37]" onChange={() => setChecked((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))} type="checkbox" />
              {criterion}
            </label>
          ))}
        </div>

        <div className={`mt-5 rounded-md border p-4 ${compliant ? "border-[#D4AF37]/40 bg-[#D4AF37]/10" : "border-red-200 bg-red-50"}`}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 size={18} /> {compliant ? "Likely compliant for further review" : "Needs restructuring before proceeding"}
          </p>
          {!compliant ? <p className="mt-2 text-sm text-[#666666]">Gaps: {gaps.join("; ")}</p> : null}
        </div>
      </section>
    </div>
  );
}
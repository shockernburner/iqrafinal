"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

type Props = {
  onClose: () => void;
};

const fields = [
  ["cash", "Cash and bank balance"],
  ["gold", "Gold/silver value"],
  ["business", "Business inventory"],
  ["receivables", "Recoverable receivables"],
  ["liabilities", "Immediate liabilities"],
] as const;

export function ZakatCalculator({ onClose }: Props) {
  const [values, setValues] = useState({ cash: 10000, gold: 0, business: 0, receivables: 0, liabilities: 0, nisab: 5000 });

  const result = useMemo(() => {
    const assets = values.cash + values.gold + values.business + values.receivables;
    const net = Math.max(0, assets - values.liabilities);
    const due = net >= values.nisab ? net * 0.025 : 0;
    return { assets, net, due };
  }, [values]);

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: Number(value) || 0 }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-md border border-[#E5E5E5] bg-white p-5 text-[#444444] shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Zakat calculator</h2>
            <p className="mt-1 text-sm text-[#666666]">Live estimate using 2.5% above nisab.</p>
          </div>
          <button aria-label="Close Zakat calculator" className="rounded-md border border-[#E5E5E5] p-2" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {fields.map(([key, label]) => (
            <label className="grid gap-1 text-sm font-medium" key={key}>
              {label}
              <input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 outline-none focus:border-[#D4AF37]" min="0" onChange={(event) => update(key, event.target.value)} type="number" value={values[key]} />
            </label>
          ))}
          <label className="grid gap-1 text-sm font-medium">
            Nisab threshold
            <input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 outline-none focus:border-[#D4AF37]" min="0" onChange={(event) => update("nisab", event.target.value)} type="number" value={values.nisab} />
          </label>
        </div>

        <div className="mt-5 grid gap-3 rounded-md bg-[#F8F9FA] p-4 text-sm sm:grid-cols-3">
          <p><span className="block text-[#777777]">Assets</span><strong>${result.assets.toLocaleString()}</strong></p>
          <p><span className="block text-[#777777]">Net zakatable</span><strong>${result.net.toLocaleString()}</strong></p>
          <p><span className="block text-[#777777]">Zakat due</span><strong className="text-[#D4AF37]">${result.due.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></p>
        </div>
      </section>
    </div>
  );
}
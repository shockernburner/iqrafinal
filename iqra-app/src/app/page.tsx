"use client";

import Image from "next/image";
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileText,
  Home as HomeIcon,
  Landmark,
  Loader2,
  LockKeyhole,
  Mic,
  MicOff,
  MessageSquareText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { type KeyboardEvent, useEffect, useState } from "react";
import { HalalChecklist } from "@/components/HalalChecklist";
import { ZakatCalculator } from "@/components/ZakatCalculator";
import { formatBasmala, type IqraResponse } from "@/lib/iqra-response";

const suggestedPrompts = [
  "Screen a halal investment",
  "Calculate my Zakat",
  "Review contract risk",
  "Leadership under pressure",
];

type ActiveTab = "home" | "assessments" | "settings";
type Message =
  | { id: number; role: "user"; text: string }
  | ({ id: number; role: "assistant"; basmala: string } & IqraResponse);

const seedMessages: Message[] = [
  {
    id: 1,
    role: "user",
    text: "Can you assess whether a revenue-sharing investment structure is Shariah-aligned and identify the risk points?",
  },
  {
    id: 2,
    role: "assistant",
    basmala: formatBasmala(),
    directAnswer:
      "A revenue-sharing structure is potentially permissible when capital, risk, profit ratios, and operational duties are explicit; it becomes non-compliant if capital protection or fixed return language turns it into a disguised interest-bearing arrangement.",
    framework: ["Amanah: fiduciary trust", "Gharar: ambiguity control", "Ihsan: operational excellence"],
    source: "Allah has permitted trade and forbidden interest. — Qur'an, Surah Al-Baqarah 2:275",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isDonating, setIsDonating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showZakat, setShowZakat] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    const savedName = window.localStorage.getItem("iqra-display-name");
    if (savedName && savedName !== "Arie") setDisplayName(savedName);
    if (savedName === "Arie") window.localStorage.removeItem("iqra-display-name");
  }, []);

  async function readChatPayload(response: Response) {
    const text = await response.text();
    if (!text) throw new Error("IQRA could not respond. Please try again in a moment.");
    try {
      return JSON.parse(text) as IqraResponse & { basmala?: string; error?: string };
    } catch {
      throw new Error("IQRA connection was interrupted. Please retry the question.");
    }
  }

  async function safeJson(response: Response) {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text) as { url?: string; error?: string };
    } catch {
      return { error: "Payments are not configured yet for this demo." };
    }
  }

  function saveDisplayName(value: string) {
    setDisplayName(value);
    window.localStorage.setItem("iqra-display-name", value);
  }

  async function sendMessage(text = input) {
    const prompt = text.trim();
    if (!prompt || isSending) return;

    setActiveTab("home");
    setInput("");
    setIsSending(true);
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: prompt }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const payload = await readChatPayload(response);
      if (!response.ok) throw new Error(payload.error ?? "IQRA could not respond.");

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          basmala: payload.basmala ?? formatBasmala(),
          directAnswer: payload.directAnswer,
          framework: payload.framework,
          source: payload.source,
          sourceLinks: payload.sourceLinks,
          requiresScholarReferral: payload.requiresScholarReferral,
          clarifyingQuestion: payload.clarifyingQuestion,
          confidence: payload.confidence,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          basmala: formatBasmala(),
          directAnswer: error instanceof Error ? error.message : "IQRA could not respond. Please try again in a moment.",
          framework: ["Retry the same question", "Check that the temporary URL is still live", "Use the local page if the tunnel dropped"],
          source: "The request did not complete, so no source was used.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function startDonation() {
    setIsDonating(true);
    setStatusMessage(null);
    try {
      const response = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 25 }),
      });
      const payload = await safeJson(response);
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Payments are not configured yet for this demo.");
      window.location.href = payload.url;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Donation failed.");
    } finally {
      setIsDonating(false);
    }
  }

  async function startVoiceInput() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setSpeechSupported(false);
      setStatusMessage("Private voice capture is not supported in this browser.");
      return;
    }

    setIsListening(true);
    setStatusMessage("Recording privately. Speak now; IQRA will transcribe through the configured local STT service.");
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      const recordingDone = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start();
      window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 6000);
      await recordingDone;

      const form = new FormData();
      form.append("audio", new Blob(chunks, { type: "audio/webm" }), "iqra-query.webm");
      const response = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      const payload = (await response.json()) as { transcript?: string; error?: string };
      if (!response.ok || !payload.transcript) throw new Error(payload.error ?? "Private transcription failed.");
      setInput(payload.transcript);
      setStatusMessage("Transcript ready. Review it before sending.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Voice input could not capture audio.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setIsListening(false);
    }
  }

  function NavButton({ tab, icon, label }: { tab: ActiveTab; icon: React.ReactNode; label: string }) {
    return (
      <button className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${activeTab === tab ? "bg-[#D4AF37]/12 text-[#8A6D16]" : "hover:bg-[#F8F9FA]"}`} onClick={() => setActiveTab(tab)} type="button">
        {icon} {label}
      </button>
    );
  }

  function MobileNavButton({ tab, icon, label }: { tab: ActiveTab; icon: React.ReactNode; label: string }) {
    return (
      <button className={`flex flex-col items-center gap-1 rounded-md py-2 ${activeTab === tab ? "bg-[#D4AF37]/14 text-[#8A6D16]" : ""}`} onClick={() => setActiveTab(tab)} type="button">
        {icon} {label}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#444444]">
      {showZakat ? <ZakatCalculator onClose={() => setShowZakat(false)} /> : null}
      {showChecklist ? <HalalChecklist onClose={() => setShowChecklist(false)} /> : null}

      {statusMessage ? <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-md border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-red-700 shadow-lg lg:bottom-6">{statusMessage}</div> : null}

      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#E5E5E5] bg-white/75 px-5 py-6 backdrop-blur lg:block">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo.jpg" alt="IQRA logo" width={44} height={44} className="h-11 w-11 rounded-md object-cover" priority />
            <div><p className="text-sm font-semibold uppercase text-[#D4AF37]">IQRA</p><h1 className="text-xl font-semibold">Assistant</h1></div>
          </div>
          <nav className="mt-8 space-y-2 text-sm font-medium">
            <NavButton tab="home" icon={<HomeIcon size={18} />} label="Home" />
            <NavButton tab="assessments" icon={<ShieldCheck size={18} />} label="Assessments" />
            <NavButton tab="settings" icon={<Settings size={18} />} label="Settings" />
          </nav>
          <div className="mt-8 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-4"><p className="text-xs font-semibold uppercase text-[#D4AF37]">System guardrail</p><p className="mt-2 text-sm leading-6">IQRA guides users through foundational Islamic principles and does not issue formal Fatwas.</p></div>
        </aside>

        <main className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_32%),linear-gradient(180deg,#FFFFFF_0%,#F8F9FA_100%)]">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5E5E5] bg-white/82 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3"><Image src="/brand/logo.jpg" alt="IQRA logo" width={38} height={38} className="h-10 w-10 rounded-md object-cover lg:hidden" priority /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#D4AF37]">IQRA Assistant</p><p className="truncate text-xs text-[#6D6D6D]">Clear Islamic ethics for modern leaders</p></div></div>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 text-sm font-semibold text-[#7A6218] transition hover:bg-[#D4AF37]/18" onClick={startDonation} type="button">{isDonating ? <Loader2 className="animate-spin" size={16} /> : <Landmark size={16} />} Donate now</button>
          </header>

          <section className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-5 flex items-center justify-between gap-3 text-xs font-semibold uppercase text-[#8B8B8B]"><span>{activeTab.toUpperCase()} • TODAY</span><span className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1 text-[#444444]"><LockKeyhole size={14} /> Private workspace</span></div>

              {activeTab === "home" ? <HomeTab messages={messages} input={input} isSending={isSending} isListening={isListening} speechSupported={speechSupported} setInput={setInput} sendMessage={sendMessage} startVoiceInput={startVoiceInput} handleComposerKeyDown={handleComposerKeyDown} openChecklist={() => setShowChecklist(true)} openZakat={() => setShowZakat(true)} /> : null}
              {activeTab === "assessments" ? <AssessmentsTab messages={messages} openChecklist={() => setShowChecklist(true)} openZakat={() => setShowZakat(true)} /> : null}
              {activeTab === "settings" ? <SettingsTab displayName={displayName} saveDisplayName={saveDisplayName} startDonation={startDonation} isDonating={isDonating} /> : null}
            </div>
          </section>

          <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-[#E5E5E5] bg-white/88 px-4 py-2 text-xs font-semibold backdrop-blur-md lg:hidden">
            <MobileNavButton tab="home" icon={<HomeIcon size={18} />} label="Home" />
            <MobileNavButton tab="assessments" icon={<ShieldCheck size={18} />} label="Assessments" />
            <MobileNavButton tab="settings" icon={<Settings size={18} />} label="Settings" />
          </nav>
        </main>
      </div>
    </div>
  );
}

function HomeTab({ messages, input, isSending, isListening, speechSupported, setInput, sendMessage, startVoiceInput, handleComposerKeyDown, openChecklist, openZakat }: { messages: Message[]; input: string; isSending: boolean; isListening: boolean; speechSupported: boolean; setInput: (value: string) => void; sendMessage: (text?: string) => Promise<void>; startVoiceInput: () => void; handleComposerKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void; openChecklist: () => void; openZakat: () => void }) {
  return <div className="space-y-4">{messages.map((message) => message.role === "user" ? <div className="ml-auto max-w-2xl rounded-md bg-[#EDEDED] px-4 py-3 text-sm leading-6 shadow-sm" key={message.id}>{message.text}</div> : <AssistantMessage key={message.id} message={message} openChecklist={openChecklist} openZakat={openZakat} />)}<div className="rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm"><div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3 text-sm font-semibold"><MessageSquareText size={18} className="text-[#D4AF37]" /> Ask IQRA</div><div className="mt-3 flex flex-wrap gap-2">{suggestedPrompts.map((prompt) => <button className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 py-2 text-sm hover:border-[#D4AF37]/60" disabled={isSending} key={prompt} onClick={() => void sendMessage(prompt)} type="button">{prompt}</button>)}</div><div className="mt-3 flex gap-2"><input aria-label="Ask IQRA" className="h-12 min-w-0 flex-1 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 text-sm outline-none transition focus:border-[#D4AF37]" onChange={(event) => setInput(event.target.value)} onKeyDown={handleComposerKeyDown} placeholder="Ask about contracts, Zakat, investments, leadership..." value={input} /><button aria-label="Voice input" className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border text-sm font-semibold ${isListening ? "border-[#D4AF37] bg-[#D4AF37]/12 text-[#8A6D16]" : "border-[#E5E5E5] bg-white text-[#444444]"}`} disabled={!speechSupported || isSending} onClick={startVoiceInput} title={speechSupported ? "Speak your question" : "Voice input is not supported in this browser"} type="button">{isListening ? <MicOff size={18} /> : <Mic size={18} />}</button><button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#444444] px-4 text-sm font-semibold text-white hover:bg-[#2F2F2F]" disabled={isSending} onClick={() => void sendMessage()} type="button">{isSending ? <Loader2 className="animate-spin" size={16} /> : null} Send</button></div></div></div>;
}

function AssistantMessage({ message, openChecklist, openZakat }: { message: Extract<Message, { role: "assistant" }>; openChecklist: () => void; openZakat: () => void }) {
  return <article className="rounded-md border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#D4AF37]/12 text-[#8A6D16]"><BookOpen size={19} /></div><div><p className="text-sm font-semibold text-[#D4AF37]">IQRA Response</p><p className="text-xs text-[#777777]">Practical guidance with source links</p></div></div><p className="text-sm leading-6 sm:text-base">{message.basmala}</p><p className="mt-3 text-sm leading-6 sm:text-base">{message.directAnswer}</p>{message.requiresScholarReferral ? <div className="mt-4 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-3 text-sm font-semibold text-[#7A6218]">This matter may require a qualified scholar or appropriate professional authority for a formal ruling or binding decision.</div> : null}{message.clarifyingQuestion ? <div className="mt-4 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-4 py-3 text-sm text-[#4A4A4A]">{message.clarifyingQuestion}</div> : null}<div className="mt-5 grid gap-3 sm:grid-cols-3">{message.framework.map((principle) => <div className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3" key={principle}><CheckCircle2 className="mb-2 text-[#D4AF37]" size={18} /><p className="text-sm font-medium">{principle}</p></div>)}</div><div className="mt-5 border-l-4 border-[#D4AF37] bg-[#F8F9FA] px-4 py-3 text-sm leading-6 text-[#4A4A4A]"><p>{message.source}</p>{message.confidence ? <p className="mt-2 text-xs font-semibold uppercase text-[#777777]">Evidence confidence: {message.confidence}</p> : null}{message.sourceLinks?.length ? <div className="mt-3 flex flex-wrap gap-2">{message.sourceLinks.map((source) => <a className="inline-flex max-w-full items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold text-[#444444] hover:border-[#D4AF37]/60" href={source.href} key={source.href} rel="noreferrer" target="_blank"><ExternalLink size={14} /><span className="truncate">{source.label}</span></a>)}</div> : null}</div><div className="mt-5 flex flex-wrap gap-2"><button className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-semibold hover:border-[#D4AF37]/50" onClick={openChecklist} type="button"><FileText size={16} /> View Halal Investment Checklist</button><button className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm font-semibold hover:border-[#D4AF37]/50" onClick={openZakat} type="button"><Calculator size={16} /> Calculate Zakat</button></div></article>;
}

function AssessmentsTab({ messages, openChecklist, openZakat }: { messages: Message[]; openChecklist: () => void; openZakat: () => void }) {
  return <div className="grid gap-4 sm:grid-cols-2"><button className="rounded-md border border-[#E5E5E5] bg-white p-5 text-left shadow-sm hover:border-[#D4AF37]/60" onClick={openChecklist} type="button"><FileText className="text-[#D4AF37]" size={24} /><h2 className="mt-4 text-lg font-semibold">Halal investment screening</h2><p className="mt-2 text-sm leading-6 text-[#666666]">Run core Shariah criteria and identify gaps before client review.</p></button><button className="rounded-md border border-[#E5E5E5] bg-white p-5 text-left shadow-sm hover:border-[#D4AF37]/60" onClick={openZakat} type="button"><Calculator className="text-[#D4AF37]" size={24} /><h2 className="mt-4 text-lg font-semibold">Zakat calculation</h2><p className="mt-2 text-sm leading-6 text-[#666666]">Estimate zakatable wealth using assets, liabilities, and nisab.</p></button><div className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm sm:col-span-2"><h2 className="text-lg font-semibold">Saved references</h2><div className="mt-3 space-y-2 text-sm text-[#666666]">{messages.filter((message) => message.role === "assistant").map((message) => <div className="rounded-md bg-[#F8F9FA] p-3" key={message.id}><p>{message.source}</p>{message.sourceLinks?.length ? <div className="mt-2 flex flex-wrap gap-2">{message.sourceLinks.map((source) => <a className="inline-flex items-center gap-1 rounded-md border border-[#E5E5E5] bg-white px-2 py-1 text-xs font-semibold text-[#444444]" href={source.href} key={source.href} rel="noreferrer" target="_blank"><ExternalLink size={12} /> {source.label}</a>)}</div> : null}</div>)}</div></div></div>;
}

function SettingsTab({ displayName, saveDisplayName, startDonation, isDonating }: { displayName: string; saveDisplayName: (value: string) => void; startDonation: () => Promise<void>; isDonating: boolean }) {
  return <div className="space-y-4"><section className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Workspace settings</h2><label className="mt-4 grid gap-2 text-sm font-medium">Display name<input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 outline-none focus:border-[#D4AF37]" onChange={(event) => saveDisplayName(event.target.value)} value={displayName} /></label><p className="mt-3 text-sm text-[#666666]">Saved locally on this Mac for the demo.</p></section><section className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Billing</h2><p className="mt-2 text-sm leading-6 text-[#666666]">Stripe payments are kept behind environment keys until the real domain is purchased and live mode is approved.</p><button className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 text-sm font-semibold text-[#7A6218] transition hover:bg-[#D4AF37]/18" disabled={isDonating} onClick={() => void startDonation()} type="button">{isDonating ? <Loader2 className="animate-spin" size={16} /> : <Landmark size={16} />} Donate now</button></section></div>;
}
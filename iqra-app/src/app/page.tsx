"use client";

import Image from "next/image";
import Link from "next/link";
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
  MessageSquareText,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { HalalChecklist } from "@/components/HalalChecklist";
import { ZakatCalculator } from "@/components/ZakatCalculator";
import { formatBasmala, type IqraResponse } from "@/lib/iqra-response";

const suggestedPrompts = [
  "Screen a halal investment",
  "Calculate my Zakat",
  "Review contract risk",
  "Leadership under pressure",
];

const loadingPhrases = ["Thinking", "Reading references", "Getting your response ready"];

type ActiveTab = "home" | "assessments" | "settings";

type ChatThread = {
  id: string;
  title: string;
  updatedAt: string;
  preview?: string | null;
};

type ApiThreadMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  responsePayload?: (IqraResponse & { basmala?: string }) | null;
};

type AsyncChatStart = { jobId?: string; error?: string };
type AsyncChatStatus = {
  status?: "running" | "completed" | "failed";
  stage?: string;
  attempt?: number;
  error?: string;
} & (IqraResponse & { basmala?: string });

type Message =
  | { id: string; role: "user"; text: string }
  | ({ id: string; role: "assistant"; basmala: string } & IqraResponse);

function NavButton({
  tab,
  icon,
  label,
  activeTab,
  onSelect,
}: {
  tab: ActiveTab;
  icon: React.ReactNode;
  label: string;
  activeTab: ActiveTab;
  onSelect: (tab: ActiveTab) => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${activeTab === tab ? "bg-[#D4AF37]/12 text-[#8A6D16]" : "hover:bg-[#F8F9FA]"}`}
      onClick={() => onSelect(tab)}
      type="button"
    >
      {icon} {label}
    </button>
  );
}

function MobileNavButton({
  tab,
  icon,
  label,
  activeTab,
  onSelect,
}: {
  tab: ActiveTab;
  icon: React.ReactNode;
  label: string;
  activeTab: ActiveTab;
  onSelect: (tab: ActiveTab) => void;
}) {
  return (
    <button
      className={`flex flex-col items-center gap-1 rounded-md py-2 ${activeTab === tab ? "bg-[#D4AF37]/14 text-[#8A6D16]" : ""}`}
      onClick={() => onSelect(tab)}
      type="button"
    >
      {icon} {label}
    </button>
  );
}

function toAssistantMessage(payload: IqraResponse & { basmala?: string }, id = crypto.randomUUID()): Extract<Message, { role: "assistant" }> {
  return {
    id,
    role: "assistant",
    basmala: payload.basmala ?? formatBasmala(),
    directAnswer: payload.directAnswer,
    framework: payload.framework,
    source: payload.source,
    sourceLinks: payload.sourceLinks,
    requiresScholarReferral: payload.requiresScholarReferral,
    clarifyingQuestion: payload.clarifyingQuestion,
    confidence: payload.confidence,
  };
}

function toUiMessage(message: ApiThreadMessage): Message {
  if (message.role === "user") {
    return { id: message.id, role: "user", text: message.content };
  }

  const payload = message.responsePayload;
  if (!payload?.directAnswer || !Array.isArray(payload.framework) || !payload.source) {
    return {
      id: message.id,
      role: "assistant",
      basmala: formatBasmala(),
      directAnswer: message.content,
      framework: ["Stored chat response"],
      source: "Saved from personal chat history",
    };
  }

  return toAssistantMessage(payload, message.id);
}

export default function Home() {
  const { data: session, status: sessionStatus } = useSession();
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isDonating, setIsDonating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showZakat, setShowZakat] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window === "undefined") return "";
    const savedName = window.localStorage.getItem("iqra-display-name");
    if (savedName === "Arie") {
      window.localStorage.removeItem("iqra-display-name");
      return "";
    }
    return savedName ?? "";
  });
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [loadingDotCount, setLoadingDotCount] = useState(0);

  useEffect(() => {
    if (!isSending) return;
    const timer = window.setInterval(() => {
      setLoadingDotCount((count) => {
        const next = (count + 1) % 4;
        if (next === 0) {
          setLoadingPhraseIndex((index) => (index + 1) % loadingPhrases.length);
        }
        return next;
      });
    }, 450);
    return () => window.clearInterval(timer);
  }, [isSending]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      void fetchThreads();
    }
    // We intentionally refresh once on auth-state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  const activeThread = useMemo(() => threads.find((thread) => thread.id === activeThreadId) ?? null, [threads, activeThreadId]);

  async function readJson<T>(response: Response, fallbackError: string): Promise<T> {
    const text = await response.text();
    if (!text) {
      throw new Error(fallbackError);
    }
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(fallbackError);
    }
  }

  async function sleep(ms: number) {
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function fetchThreads() {
    if (sessionStatus !== "authenticated") return;
    const response = await fetch("/api/chats", { cache: "no-store" });
    const payload = await readJson<{ threads?: ChatThread[]; error?: string }>(response, "Could not read chat history.");
    if (!response.ok) {
      throw new Error(payload.error ?? "Unable to load chat history.");
    }
    setThreads(payload.threads ?? []);
  }

  async function loadThread(threadId: string) {
    if (sessionStatus !== "authenticated") return;
    setIsLoadingThread(true);
    setStatusMessage(null);
    try {
      const response = await fetch(`/api/chats/${threadId}`, { cache: "no-store" });
      const payload = await readJson<{ messages?: ApiThreadMessage[]; error?: string }>(response, "Could not read this chat.");
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to open chat.");
      }
      setActiveThreadId(threadId);
      setMessages((payload.messages ?? []).map(toUiMessage));
      setActiveTab("home");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to open chat.");
    } finally {
      setIsLoadingThread(false);
    }
  }

  function startNewChat() {
    setActiveThreadId(null);
    setMessages([]);
    setInput("");
    setStatusMessage(null);
    setActiveTab("home");
  }

  async function createThread(initialTitle?: string) {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: initialTitle }),
    });
    const payload = await readJson<{ id?: string; error?: string }>(response, "Unable to create a chat.");
    if (!response.ok || !payload.id) {
      throw new Error(payload.error ?? "Unable to create a chat.");
    }
    return payload.id;
  }

  async function persistTurn(threadId: string, userText: string, assistantPayload: IqraResponse & { basmala?: string }) {
    const response = await fetch(`/api/chats/${threadId}/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, assistantPayload }),
    });
    if (!response.ok) {
      const payload = await readJson<{ error?: string }>(response, "Unable to save this chat turn.");
      throw new Error(payload.error ?? "Unable to save this chat turn.");
    }
  }

  async function waitForAsyncChatResult(jobId: string) {
    while (true) {
      await sleep(1200);
      const response = await fetch(`/api/chat/async/${jobId}`, { cache: "no-store" });
      const payload = await readJson<AsyncChatStatus>(response, "IQRA could not check background retraining.");
      if (!response.ok) throw new Error(payload.error ?? "IQRA could not check background retraining.");
      if (payload.status === "completed") return payload;
      if (payload.status === "failed") throw new Error(payload.error ?? "IQRA background retraining failed.");
    }
  }

  async function sendMessage(text = input) {
    const prompt = text.trim();
    if (!prompt || isSending) return;

    if (sessionStatus !== "authenticated") {
      setStatusMessage("Please login to start and save personal chats.");
      return;
    }

    setActiveTab("home");
    setInput("");
    setIsSending(true);
    setLoadingDotCount(0);
    setLoadingPhraseIndex(0);
    setStatusMessage("Thinking");

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", text: prompt };
    setMessages((current) => [...current, userMessage]);

    try {
      const startResponse = await fetch("/api/chat/async", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const startPayload = await readJson<AsyncChatStart>(startResponse, "IQRA could not start background processing.");
      if (!startResponse.ok || !startPayload.jobId) {
        throw new Error(startPayload.error ?? "IQRA could not start background processing.");
      }

      const payload = await waitForAsyncChatResult(startPayload.jobId);
      const assistantMessage = toAssistantMessage(payload);
      setMessages((current) => [...current, assistantMessage]);

      let threadId = activeThreadId;
      if (!threadId) {
        threadId = await createThread(prompt);
        setActiveThreadId(threadId);
      }

      await persistTurn(threadId, prompt, payload);
      await fetchThreads();
      setStatusMessage(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "IQRA could not respond. Please try again.";
      setStatusMessage(message);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          basmala: formatBasmala(),
          directAnswer: message,
          framework: ["Retry the question", "Use New chat if context is mixed", "Check your login session"],
          source: "The request did not complete, so no source was used.",
        },
      ]);
    } finally {
      setIsSending(false);
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
      const payload = await readJson<{ url?: string; error?: string }>(response, "Payments are not configured yet for this demo.");
      if (!response.ok || !payload.url) throw new Error(payload.error ?? "Payments are not configured yet for this demo.");
      window.location.href = payload.url;
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Donation failed.");
    } finally {
      setIsDonating(false);
    }
  }

  function saveDisplayName(value: string) {
    setDisplayName(value);
    window.localStorage.setItem("iqra-display-name", value);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#444444]">
      {showZakat ? <ZakatCalculator onClose={() => setShowZakat(false)} /> : null}
      {showChecklist ? <HalalChecklist onClose={() => setShowChecklist(false)} /> : null}

      {statusMessage ? (
        <div
          className={`fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-md border px-4 py-3 text-sm shadow-lg lg:bottom-6 ${isSending ? "border-[#D4AF37]/35 bg-white text-[#7A6218]" : "border-[#E5E5E5] bg-white text-red-700"}`}
        >
          {isSending ? `${loadingPhrases[loadingPhraseIndex]}${".".repeat(loadingDotCount)}` : statusMessage}
        </div>
      ) : null}

      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#E5E5E5] bg-white/75 px-5 py-6 backdrop-blur lg:block">
          <div className="flex items-center gap-3">
            <Image src="/brand/logo.jpg" alt="IQRA logo" width={44} height={44} className="h-11 w-11 rounded-md object-cover" priority />
            <div>
              <p className="text-sm font-semibold uppercase text-[#D4AF37]">IQRA</p>
              <h1 className="text-xl font-semibold">Assistant</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-2 text-sm font-medium">
            <NavButton tab="home" icon={<HomeIcon size={18} />} label="Home" activeTab={activeTab} onSelect={setActiveTab} />
            <NavButton tab="assessments" icon={<ShieldCheck size={18} />} label="Assessments" activeTab={activeTab} onSelect={setActiveTab} />
            <NavButton tab="settings" icon={<Settings size={18} />} label="Settings" activeTab={activeTab} onSelect={setActiveTab} />
          </nav>

          <section className="mt-8 rounded-md border border-[#E5E5E5] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-[#D4AF37]">Personal history</p>
              <button
                className="inline-flex items-center gap-1 rounded-md border border-[#E5E5E5] px-2 py-1 text-xs font-semibold hover:border-[#D4AF37]/60"
                onClick={startNewChat}
                type="button"
              >
                <Plus size={12} /> New
              </button>
            </div>

            {sessionStatus !== "authenticated" ? (
              <p className="text-sm text-[#666666]">Login to see your personal chat history.</p>
            ) : threads.length === 0 ? (
              <p className="text-sm text-[#666666]">No chats yet. Start with a new chat.</p>
            ) : (
              <div className="space-y-2">
                {threads.map((thread) => (
                  <button
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${activeThreadId === thread.id ? "border-[#D4AF37]/60 bg-[#D4AF37]/8" : "border-[#E5E5E5] bg-[#F8F9FA] hover:border-[#D4AF37]/40"}`}
                    key={thread.id}
                    onClick={() => void loadThread(thread.id)}
                    type="button"
                  >
                    <p className="truncate font-semibold">{thread.title}</p>
                    <p className="truncate text-xs text-[#777777]">{thread.preview ?? "No messages yet"}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="mt-8 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-4">
            <p className="text-xs font-semibold uppercase text-[#D4AF37]">System guardrail</p>
            <p className="mt-2 text-sm leading-6">IQRA guides users through foundational Islamic principles and does not issue formal Fatwas.</p>
          </div>
        </aside>

        <main className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.12),transparent_32%),linear-gradient(180deg,#FFFFFF_0%,#F8F9FA_100%)]">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5E5E5] bg-white/82 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Image src="/brand/logo.jpg" alt="IQRA logo" width={38} height={38} className="h-10 w-10 rounded-md object-cover lg:hidden" priority />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#D4AF37]">IQRA Assistant</p>
                <p className="truncate text-xs text-[#6D6D6D]">
                  {activeThread ? `Chat: ${activeThread.title}` : "New chat"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {sessionStatus === "authenticated" ? (
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#E5E5E5] bg-white px-3 text-sm font-semibold text-[#444444] hover:border-[#D4AF37]/60"
                  onClick={() => void signOut({ callbackUrl: "/" })}
                  type="button"
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link className="inline-flex h-10 items-center justify-center rounded-md border border-[#E5E5E5] bg-white px-3 text-sm font-semibold text-[#444444] hover:border-[#D4AF37]/60" href="/login">Login</Link>
                  <Link className="inline-flex h-10 items-center justify-center rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 text-sm font-semibold text-[#7A6218] hover:bg-[#D4AF37]/18" href="/register">Register</Link>
                </>
              )}

              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 text-sm font-semibold text-[#7A6218] transition hover:bg-[#D4AF37]/18" onClick={startDonation} type="button">
                {isDonating ? <Loader2 className="animate-spin" size={16} /> : <Landmark size={16} />} Donate
              </button>
            </div>
          </header>

          <section className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-5 flex items-center justify-between gap-3 text-xs font-semibold uppercase text-[#8B8B8B]">
                <span>{activeTab.toUpperCase()} • TODAY</span>
                <span className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1 text-[#444444]"><LockKeyhole size={14} /> Private workspace</span>
              </div>

              {activeTab === "home" ? (
                <HomeTab
                  messages={messages}
                  input={input}
                  isSending={isSending}
                  isLoadingThread={isLoadingThread}
                  isAuthenticated={sessionStatus === "authenticated"}
                  setInput={setInput}
                  sendMessage={sendMessage}
                  handleComposerKeyDown={handleComposerKeyDown}
                  openChecklist={() => setShowChecklist(true)}
                  openZakat={() => setShowZakat(true)}
                  onNewChat={startNewChat}
                />
              ) : null}

              {activeTab === "assessments" ? <AssessmentsTab messages={messages} openChecklist={() => setShowChecklist(true)} openZakat={() => setShowZakat(true)} /> : null}
              {activeTab === "settings" ? <SettingsTab displayName={displayName} saveDisplayName={saveDisplayName} startDonation={startDonation} isDonating={isDonating} userEmail={session?.user?.email ?? "Not signed in"} /> : null}
            </div>
          </section>

          <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t border-[#E5E5E5] bg-white/88 px-4 py-2 text-xs font-semibold backdrop-blur-md lg:hidden">
            <MobileNavButton tab="home" icon={<HomeIcon size={18} />} label="Home" activeTab={activeTab} onSelect={setActiveTab} />
            <MobileNavButton tab="assessments" icon={<ShieldCheck size={18} />} label="Assessments" activeTab={activeTab} onSelect={setActiveTab} />
            <MobileNavButton tab="settings" icon={<Settings size={18} />} label="Settings" activeTab={activeTab} onSelect={setActiveTab} />
          </nav>
        </main>
      </div>
    </div>
  );
}

function HomeTab({
  messages,
  input,
  isSending,
  isLoadingThread,
  isAuthenticated,
  setInput,
  sendMessage,
  handleComposerKeyDown,
  openChecklist,
  openZakat,
  onNewChat,
}: {
  messages: Message[];
  input: string;
  isSending: boolean;
  isLoadingThread: boolean;
  isAuthenticated: boolean;
  setInput: (value: string) => void;
  sendMessage: (text?: string) => Promise<void>;
  handleComposerKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  openChecklist: () => void;
  openZakat: () => void;
  onNewChat: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-[#8B8B8B]">Conversation</h2>
        <button className="inline-flex items-center gap-1 rounded-md border border-[#E5E5E5] bg-white px-3 py-1.5 text-xs font-semibold hover:border-[#D4AF37]/60" onClick={onNewChat} type="button">
          <Plus size={12} /> New chat
        </button>
      </div>

      {isLoadingThread ? (
        <div className="rounded-md border border-[#E5E5E5] bg-white p-4 text-sm text-[#666666]">Loading chat...</div>
      ) : messages.length === 0 ? (
        <div className="rounded-md border border-[#E5E5E5] bg-white p-4 text-sm text-[#666666]">This is a fresh chat. Ask your first question.</div>
      ) : (
        messages.map((message) =>
          message.role === "user" ? (
            <div className="ml-auto max-w-2xl rounded-md bg-[#EDEDED] px-4 py-3 text-sm leading-6 shadow-sm" key={message.id}>
              {message.text}
            </div>
          ) : (
            <AssistantMessage key={message.id} message={message} openChecklist={openChecklist} openZakat={openZakat} />
          ),
        )
      )}

      <div className="rounded-md border border-[#E5E5E5] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3 text-sm font-semibold">
          <MessageSquareText size={18} className="text-[#D4AF37]" /> Ask IQRA
        </div>

        {!isAuthenticated ? (
          <p className="mt-3 text-sm text-[#666666]">Login to start a new personal chat and keep your own history.</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt) => (
            <button className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 py-2 text-sm hover:border-[#D4AF37]/60" disabled={isSending || !isAuthenticated} key={prompt} onClick={() => void sendMessage(prompt)} type="button">
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            aria-label="Ask IQRA"
            className="h-12 min-w-0 flex-1 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 text-sm outline-none transition focus:border-[#D4AF37]"
            disabled={!isAuthenticated || isSending}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={isAuthenticated ? "Ask about contracts, Zakat, investments, leadership..." : "Login to ask IQRA"}
            value={input}
          />
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#444444] px-4 text-sm font-semibold text-white hover:bg-[#2F2F2F]" disabled={isSending || !isAuthenticated} onClick={() => void sendMessage()} type="button">
            {isSending ? <Loader2 className="animate-spin" size={16} /> : null} Send
          </button>
        </div>
      </div>
    </div>
  );
}

function AssistantMessage({ message, openChecklist, openZakat }: { message: Extract<Message, { role: "assistant" }>; openChecklist: () => void; openZakat: () => void }) {
  return (
    <article className="rounded-md border border-[#E5E5E5] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#D4AF37]/12 text-[#8A6D16]">
          <BookOpen size={19} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#D4AF37]">IQRA Response</p>
          <p className="text-xs text-[#777777]">Practical guidance with source links</p>
        </div>
      </div>

      <p className="text-sm leading-6 sm:text-base">{message.basmala}</p>
      <p className="mt-3 text-sm leading-6 sm:text-base">{message.directAnswer}</p>

      {message.requiresScholarReferral ? (
        <div className="mt-4 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-3 text-sm font-semibold text-[#7A6218]">
          This matter may require a qualified scholar or appropriate professional authority for a formal ruling or binding decision.
        </div>
      ) : null}

      {message.clarifyingQuestion ? (
        <div className="mt-4 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-4 py-3 text-sm text-[#4A4A4A]">
          {message.clarifyingQuestion}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {message.framework.map((principle) => (
          <div className="rounded-md border border-[#E5E5E5] bg-[#F8F9FA] p-3" key={principle}>
            <CheckCircle2 className="mb-2 text-[#D4AF37]" size={18} />
            <p className="text-sm font-medium">{principle}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-l-4 border-[#D4AF37] bg-[#F8F9FA] px-4 py-3 text-sm leading-6 text-[#4A4A4A]">
        <p>{message.source}</p>
        {message.confidence ? <p className="mt-2 text-xs font-semibold uppercase text-[#777777]">Evidence confidence: {message.confidence}</p> : null}
        {message.sourceLinks?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.sourceLinks.map((source) => (
              <a className="inline-flex max-w-full items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold text-[#444444] hover:border-[#D4AF37]/60" href={source.href} key={source.href} rel="noreferrer" target="_blank">
                <ExternalLink size={14} />
                <span className="truncate">{source.label}</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold hover:border-[#D4AF37]/60" onClick={openChecklist} type="button">
          <FileText size={14} /> Investment checklist
        </button>
        <button className="inline-flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-xs font-semibold hover:border-[#D4AF37]/60" onClick={openZakat} type="button">
          <Calculator size={14} /> Zakat calculator
        </button>
      </div>
    </article>
  );
}

function AssessmentsTab({ messages, openChecklist, openZakat }: { messages: Message[]; openChecklist: () => void; openZakat: () => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button className="rounded-md border border-[#E5E5E5] bg-white p-5 text-left shadow-sm hover:border-[#D4AF37]/60" onClick={openChecklist} type="button">
        <FileText className="text-[#D4AF37]" size={24} />
        <h2 className="mt-4 text-lg font-semibold">Halal investment screening</h2>
        <p className="mt-2 text-sm leading-6 text-[#666666]">Run core Shariah criteria and identify gaps before client review.</p>
      </button>

      <button className="rounded-md border border-[#E5E5E5] bg-white p-5 text-left shadow-sm hover:border-[#D4AF37]/60" onClick={openZakat} type="button">
        <Calculator className="text-[#D4AF37]" size={24} />
        <h2 className="mt-4 text-lg font-semibold">Zakat calculation</h2>
        <p className="mt-2 text-sm leading-6 text-[#666666]">Estimate zakatable wealth using assets, liabilities, and nisab.</p>
      </button>

      <div className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm sm:col-span-2">
        <h2 className="text-lg font-semibold">Saved references</h2>
        <div className="mt-3 space-y-2 text-sm text-[#666666]">
          {messages
            .filter((message): message is Extract<Message, { role: "assistant" }> => message.role === "assistant")
            .map((message) => (
              <div className="rounded-md bg-[#F8F9FA] p-3" key={message.id}>
                <p>{message.source}</p>
                {message.sourceLinks?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.sourceLinks.map((source) => (
                      <a className="inline-flex items-center gap-1 rounded-md border border-[#E5E5E5] bg-white px-2 py-1 text-xs font-semibold text-[#444444]" href={source.href} key={source.href} rel="noreferrer" target="_blank">
                        <ExternalLink size={12} /> {source.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ displayName, saveDisplayName, startDonation, isDonating, userEmail }: { displayName: string; saveDisplayName: (value: string) => void; startDonation: () => Promise<void>; isDonating: boolean; userEmail: string }) {
  return (
    <div className="space-y-4">
      <section className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Workspace settings</h2>
        <p className="mt-2 text-sm text-[#666666]">Signed in as: {userEmail}</p>
        <label className="mt-4 grid gap-2 text-sm font-medium">
          Display name
          <input className="h-11 rounded-md border border-[#E5E5E5] bg-[#F8F9FA] px-3 outline-none focus:border-[#D4AF37]" onChange={(event) => saveDisplayName(event.target.value)} value={displayName} />
        </label>
        <p className="mt-3 text-sm text-[#666666]">Saved locally on this Mac for the demo.</p>
      </section>

      <section className="rounded-md border border-[#E5E5E5] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Billing</h2>
        <p className="mt-2 text-sm leading-6 text-[#666666]">Stripe payments are kept behind environment keys until the real domain is purchased and live mode is approved.</p>
        <button className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 text-sm font-semibold text-[#7A6218] transition hover:bg-[#D4AF37]/18" disabled={isDonating} onClick={() => void startDonation()} type="button">
          {isDonating ? <Loader2 className="animate-spin" size={16} /> : <Landmark size={16} />} Donate now
        </button>
      </section>
    </div>
  );
}

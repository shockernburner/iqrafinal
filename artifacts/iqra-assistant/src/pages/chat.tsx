import { useState, useRef, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  appendChatTurn,
  createChat,
  getChat,
  getListChatsQueryKey,
  getOlderChatMessages,
  sendChat,
  type ChatResponse,
  type ChatThreadDetail,
} from "@workspace/api-client-react";
import { Send, Loader2, Copy, Check, Share2 } from "lucide-react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import logoPng from "@/assets/logo.png";
import ReactMarkdown from "react-markdown";

const CHAT_GENERATION_TIMEOUT_MS = 95_000;
const CHAT_SAVE_TIMEOUT_MS = 15_000;

class ClientRequestTimeoutError extends Error {}

type PendingTurn = {
  turnId: string;
  userText: string;
  chatId?: string;
  assistantPayload?: ChatResponse;
};

function chatThreadQueryKey(id: string) {
  return ["chat-thread", id] as const;
}

async function withRequestTimeout<T>(
  run: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ClientRequestTimeoutError("The request took too long.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof ClientRequestTimeoutError) {
    return "IQRA took too long to respond. Please try your question again.";
  }
  if (error && typeof error === "object") {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string") {
      return (data as { error: string }).error;
    }
    if (typeof (error as { message?: unknown }).message === "string") {
      return (error as { message: string }).message;
    }
  }
  return "The response could not be completed. Please try again.";
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name && name.trim()) || (email ? email.split("@")[0] : "");
  if (!source) return "U";
  const words = source.trim().split(/\s+/).filter(Boolean);
  const initials = words.map((w) => w[0]!.toUpperCase()).join("");
  return initials.slice(0, 3) || source[0]!.toUpperCase();
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const userInitials = getInitials(user?.name, user?.email);
  const searchParams = new URLSearchParams(search);
  const chatId = searchParams.get("chatId");
  
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [retryTurn, setRetryTurn] = useState<PendingTurn | null>(null);
  const submissionInFlightRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context); silently ignore.
    }
  };

  const handleShare = async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "IQRA Assistant", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedId("share-fallback");
        setTimeout(() => setCopiedId((c) => (c === "share-fallback" ? null : c)), 2000);
      }
    } catch {
      // User cancelled the share sheet or sharing is unavailable; ignore.
    }
  };
  
  const chatQuery = useInfiniteQuery({
    queryKey: chatThreadQueryKey(chatId ?? ""),
    queryFn: ({ pageParam, signal }) =>
      pageParam
        ? getOlderChatMessages(chatId!, pageParam, { signal })
        : getChat(chatId!, { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined),
    enabled: !!chatId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const messages = useMemo(() => {
    const seen = new Set<string>();
    return [...(chatQuery.data?.pages ?? [])]
      .reverse()
      .flatMap((page) => page.messages)
      .filter((message) => {
        if (seen.has(message.id)) return false;
        seen.add(message.id);
        return true;
      });
  }, [chatQuery.data?.pages]);

  const handleSend = async () => {
    const userText = input.trim();
    if (!userText || submissionInFlightRef.current) return;

    submissionInFlightRef.current = true;
    setIsGenerating(true);
    setSendError(null);
    setInput("");
    let pending: PendingTurn =
      retryTurn?.userText === userText
        ? retryTurn
        : { turnId: crypto.randomUUID(), userText };
    try {
      let targetChatId = pending.chatId ?? chatId;
      if (!targetChatId) {
        const thread = await createChat({ title: userText.substring(0, 30) + "..." });
        targetChatId = thread.id;
        setLocation(`/?chatId=${thread.id}`);
      }
      pending = { ...pending, chatId: targetChatId };
      setRetryTurn(pending);

      const assistantPayload =
        pending.assistantPayload ??
        (await withRequestTimeout(
          (signal) => sendChat({ prompt: userText }, { signal }),
          CHAT_GENERATION_TIMEOUT_MS,
        ));
      pending = { ...pending, assistantPayload };
      setRetryTurn(pending);

      await withRequestTimeout(
        (signal) =>
          appendChatTurn(
            targetChatId,
            {
              turnId: pending.turnId,
              userText,
              assistantPayload: assistantPayload as unknown as Record<string, unknown>,
            },
            { signal },
          ),
        CHAT_SAVE_TIMEOUT_MS,
      );

      // Refresh only the newest bounded page. Older pages remain safely stored
      // server-side and can be loaded again with the cursor button.
      const latestPage = await getChat(targetChatId);
      queryClient.setQueryData<InfiniteData<ChatThreadDetail, string | null>>(
        chatThreadQueryKey(targetChatId),
        { pages: [latestPage], pageParams: [null] },
      );
      await queryClient.invalidateQueries({ queryKey: getListChatsQueryKey() });
      setRetryTurn(null);
    } catch (error) {
      setRetryTurn(pending);
      setSendError(errorMessage(error));
      setInput(userText);
    } finally {
      submissionInFlightRef.current = false;
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const latestMessageId = messages[messages.length - 1]?.id;
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [latestMessageId, isGenerating]);

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-16 hidden md:flex items-center px-6 border-b border-border/40 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <h2 className="font-serif text-lg font-medium">
            {messages.length > 0
              ? messages[0].content.substring(0, 40) + "..."
              : "New Reflection"}
          </h2>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-6 md:px-8 md:py-8">
          <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-20">
            
            {!chatId && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6 opacity-80">
                <h2 className="font-serif text-3xl text-foreground">Seek knowledge from the cradle to the grave.</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask questions about Islamic ethics, seek guidance on dilemmas, or explore teachings from traditional scholarship.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
                  {["What are the rights of neighbors?", "How to handle anger at work?", "Summarize Al-Ghazali on the heart", "Ethics of business in Islam"].map((suggestion) => (
                    <button 
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="p-4 text-sm text-left border border-border rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatQuery.isPending && chatId ? (
              <div className="space-y-8">
                <div className="flex gap-4 max-w-[85%] ml-auto justify-end">
                  <Skeleton className="h-16 w-64 rounded-2xl rounded-tr-sm" />
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                </div>
                <div className="flex gap-4 max-w-[85%]">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-32 w-full rounded-2xl rounded-tl-sm" />
                </div>
              </div>
            ) : (
              <>
                {chatQuery.hasNextPage && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={chatQuery.isFetchingNextPage}
                      onClick={() => void chatQuery.fetchNextPage()}
                    >
                      {chatQuery.isFetchingNextPage && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Load earlier messages
                    </Button>
                  </div>
                )}
                {messages.map((msg, i) => (
                <div 
                  key={msg.id || i} 
                  className={`flex gap-2 md:gap-4 ${msg.role === "user" ? "ml-auto justify-end max-w-[90%] md:max-w-[85%]" : "max-w-[95%] md:max-w-[85%]"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <img src={logoPng} alt="IQRA" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                  
                  <div 
                    className={`p-4 md:p-5 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-card border border-border/60 shadow-sm rounded-tl-sm text-card-foreground prose prose-sm md:prose-base prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground max-w-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {(() => {
                          const confidence = (msg.responsePayload as Record<string, unknown> | null)?.confidence;
                          if (confidence === "high" || confidence === "medium" || confidence === "low") {
                            return (
                              <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2 not-prose">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    confidence === "low"
                                      ? "bg-destructive/10 text-destructive"
                                      : confidence === "medium"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  }`}
                                  data-testid="badge-confidence"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                  {confidence === "low"
                                    ? "Low confidence"
                                    : confidence === "medium"
                                      ? "Moderate confidence"
                                      : "High confidence"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {confidence === "low"
                                    ? "Verify with a qualified scholar."
                                    : confidence === "medium"
                                      ? "Not yet fully grounded in the IQRA library."
                                      : "Grounded in the IQRA library."}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}

                    {msg.role === "assistant" && (
                      <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-1 not-prose">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                          onClick={() => handleCopy(msg.content, msg.id ?? String(i))}
                          aria-label="Copy response"
                          data-testid="button-copy-response"
                        >
                          {copiedId === (msg.id ?? String(i)) ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                          onClick={() => handleShare(msg.content)}
                          aria-label="Share response"
                          data-testid="button-share-response"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Share
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-1 text-xs font-semibold tracking-tight" aria-label={user?.name || "User"}>
                      {userInitials}
                    </div>
                  )}
                </div>
                ))}
              </>
            )}
            
            {isGenerating && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <img src={logoPng} alt="IQRA" className="w-5 h-5 object-contain" />
                </div>
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm rounded-tl-sm text-card-foreground flex items-center gap-3" data-testid="indicator-thinking">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]" />
                  </div>
                  <span className="text-sm text-muted-foreground">Thinking — consulting the sources…</span>
                </div>
              </div>
            )}

            {sendError && (
              <div
                className="ml-10 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
                role="alert"
                data-testid="chat-send-error"
              >
                <p className="text-destructive">{sendError}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => void handleSend()}>
                    Try again
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSendError(null)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 md:p-6 bg-background border-t border-border/40">
          <div className="max-w-3xl mx-auto relative flex items-end shadow-sm rounded-xl overflow-hidden border border-border focus-within:ring-1 focus-within:ring-ring transition-shadow bg-card">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Ask for guidance or reflection..."
              className="min-h-[60px] max-h-[200px] w-full resize-none border-0 focus-visible:ring-0 rounded-none bg-transparent py-4 pl-4 pr-14 text-base"
              rows={1}
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              size="icon"
              className="absolute right-2 bottom-2 w-10 h-10 rounded-lg shrink-0"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Responses are generated by AI and grounded in traditional texts. Seek qualified scholars for specific fatwas.
          </p>
        </div>
        
      </div>
    </AppLayout>
  );
}

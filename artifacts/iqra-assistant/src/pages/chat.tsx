import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout";
import { useLocation } from "wouter";
import { 
  useGetChat, 
  useAppendChatTurn, 
  useCreateChat,
  useSendChat 
} from "@workspace/api-client-react";
import { Send, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import logoPng from "@/assets/logo.png";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const chatId = searchParams.get("chatId");
  
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: chatData, isLoading: isLoadingChat } = useGetChat(
    chatId as string, 
    { query: { enabled: !!chatId, refetchInterval: 2000 } as any } // Poll to get updates since backend process might be async
  );
  
  const sendChatMutation = useSendChat();
  const sendTurnMutation = useAppendChatTurn();

  const submitTurn = async (id: string, userText: string) => {
    const assistantPayload = await sendChatMutation.mutateAsync({ data: { prompt: userText } });
    await sendTurnMutation.mutateAsync({
      id,
      data: { userText, assistantPayload: assistantPayload as unknown as Record<string, unknown> },
    });
  };

  const createChatMutation = useCreateChat({
    mutation: {
      onSuccess: (thread) => {
        setLocation(`/?chatId=${thread.id}`);
        const pendingInput = input;
        setInput("");
        void submitTurn(thread.id, pendingInput);
      }
    }
  });

  const isGenerating =
    sendChatMutation.isPending ||
    sendTurnMutation.isPending ||
    createChatMutation.isPending ||
    (chatData && chatData.messages.length > 0 && chatData.messages[chatData.messages.length - 1].role === "user" && !chatData.messages.some(m => m.role === 'assistant' && new Date(m.createdAt) > new Date(chatData.messages[chatData.messages.length - 1].createdAt)));

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    
    if (!chatId) {
      createChatMutation.mutate({ data: { title: input.substring(0, 30) + "..." } });
    } else {
      const pendingInput = input;
      setInput("");
      void submitTurn(chatId, pendingInput);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatData?.messages, isGenerating]);

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-16 flex items-center px-6 border-b border-border/40 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
          <h2 className="font-serif text-lg font-medium">
            {chatData && chatData.messages.length > 0
              ? chatData.messages[0].content.substring(0, 40) + "..."
              : "New Reflection"}
          </h2>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-3xl mx-auto space-y-8 pb-20">
            
            {!chatId && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6 opacity-80">
                <img src={logoPng} alt="IQRA" className="w-16 h-16 rounded-md opacity-80" />
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

            {isLoadingChat && chatId ? (
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
              chatData?.messages.map((msg, i) => (
                <div 
                  key={msg.id || i} 
                  className={`flex gap-4 ${msg.role === "user" ? "ml-auto justify-end max-w-[85%]" : "max-w-[95%] md:max-w-[85%]"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <img src={logoPng} alt="IQRA" className="w-5 h-5 object-contain" />
                    </div>
                  )}
                  
                  <div 
                    className={`p-5 rounded-2xl ${
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
                      </div>
                    )}
                  </div>
                  
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isGenerating && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <img src={logoPng} alt="IQRA" className="w-5 h-5 object-contain" />
                </div>
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm rounded-tl-sm text-card-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-4 md:p-6 bg-background border-t border-border/40">
          <div className="max-w-3xl mx-auto relative flex items-end shadow-sm rounded-xl overflow-hidden border border-border focus-within:ring-1 focus-within:ring-ring transition-shadow bg-card">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
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

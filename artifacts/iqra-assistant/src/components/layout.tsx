import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogOut, LayoutDashboard, MessageSquare, Heart, Settings, Plus, Loader2, Menu, X, FileText, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListChats, useCreateChat } from "@workspace/api-client-react";
import logoPng from "@/assets/logo.png";
import { Skeleton } from "@/components/ui/skeleton";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const activeChatId = new URLSearchParams(search).get("chatId");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: chatsData, isLoading: isLoadingChats } = useListChats({
    query: {
      enabled: !!user
    } as any
  });
  
  const createChat = useCreateChat({
    mutation: {
      onSuccess: (thread) => {
        setSidebarOpen(false);
        setLocation(`/?chatId=${thread.id}`);
      }
    }
  });

  const handleNewChat = () => {
    createChat.mutate({ data: { title: "New Conversation" } });
  };

  const navigate = (to: string) => {
    setSidebarOpen(false);
    setLocation(to);
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sidebarOpen]);

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col text-sidebar-foreground transform transition-transform duration-200 ease-in-out md:static md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center gap-3">
          <img src={logoPng} alt="IQRA Assistant" className="w-8 h-8 rounded-sm object-contain" />
          <h1 className="font-serif font-semibold text-xl tracking-wide">IQRA</h1>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto md:hidden text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="px-4 pb-4">
          <Button 
            onClick={handleNewChat} 
            disabled={createChat.isPending}
            className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-medium"
          >
            {createChat.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            New Reflection
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 mt-4 px-2">
            Conversations
          </div>
          {isLoadingChats ? (
            <div className="space-y-2 px-2">
              <Skeleton className="h-8 w-full bg-sidebar-accent/50" />
              <Skeleton className="h-8 w-full bg-sidebar-accent/50" />
              <Skeleton className="h-8 w-3/4 bg-sidebar-accent/50" />
            </div>
          ) : chatsData?.threads?.length ? (
            chatsData.threads.map(thread => (
              <Button
                key={thread.id}
                variant="ghost"
                className={`w-full justify-start font-normal text-sm px-3 h-9 ${activeChatId === thread.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
                onClick={() => navigate(`/?chatId=${thread.id}`)}
              >
                <MessageSquare className="w-4 h-4 mr-2 opacity-70" />
                <span className="truncate">{thread.title || "Untitled Reflection"}</span>
              </Button>
            ))
          ) : (
            <div className="px-2 py-4 text-sm text-sidebar-foreground/50 italic text-center">
              No previous conversations.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-sidebar-border flex flex-col gap-1">
          {user?.role === "admin" && (
            <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => navigate("/admin")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Button>
          )}
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => navigate("/donate")}>
            <Heart className="w-4 h-4 mr-2" />
            Support IQRA
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => navigate("/terms")}>
            <FileText className="w-4 h-4 mr-2" />
            Terms of Service
          </Button>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={() => navigate("/privacy")}>
            <Shield className="w-4 h-4 mr-2" />
            Privacy Policy
          </Button>
          <a
            href="mailto:contact@iqra.live"
            className="w-full inline-flex items-center h-9 px-3 rounded-md text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact
          </a>
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
        {/* Mobile top bar */}
        <div className="md:hidden h-14 shrink-0 flex items-center gap-3 px-3 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <img src={logoPng} alt="IQRA Assistant" className="w-6 h-6 rounded-sm object-contain" />
          <span className="font-serif font-semibold text-lg tracking-wide">IQRA</span>
        </div>
        {children}
      </main>
    </div>
  );
}

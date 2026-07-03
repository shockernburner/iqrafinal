import React, { createContext, useContext, ReactNode } from "react";
import { useGetSession, useLogout, AuthUser } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  // @ts-ignore - generated hook option typing requires queryKey but it is supplied internally
  const { data: session, isLoading } = useGetSession({ query: { retry: false } });
  
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    }
  });

  return (
    <AuthContext.Provider 
      value={{ 
        user: session?.user ?? null, 
        isLoading,
        logout: () => logoutMutation.mutate() 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

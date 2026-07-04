import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router as WouterRouter } from "wouter";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import OurVision from "@/pages/our-vision";
import "./index.css";

export interface PrerenderedRoute {
  path: string;
  outFile: string;
  title: string;
  description: string;
  robots: string;
  canonicalPath: string;
  Component: () => ReactElement;
}

// Anonymous, JS-free-friendly routes that get a build-time prerendered
// static HTML shell (see scripts/prerender.mjs). Authenticated routes
// (chat, donate, admin) depend on live session/data fetches and are
// intentionally left to render purely client-side.
export const PRERENDER_ROUTES: PrerenderedRoute[] = [
  {
    path: "/",
    outFile: "index.html",
    title: "IQRA Assistant — Islamic Ethics & Leadership Guidance",
    description:
      "IQRA Assistant offers wisdom and guidance rooted in traditional Islamic texts on ethics and leadership. Sign in or create a free account to start reflecting.",
    robots: "index, follow",
    canonicalPath: "/",
    Component: Landing,
  },
  {
    path: "/login",
    outFile: "login/index.html",
    title: "Sign In — IQRA Assistant",
    description:
      "Sign in to your IQRA Assistant account to continue your conversations on Islamic ethics and leadership.",
    robots: "noindex, follow",
    canonicalPath: "/login",
    Component: Login,
  },
  {
    path: "/register",
    outFile: "register/index.html",
    title: "Create Account — IQRA Assistant",
    description:
      "Create a free IQRA Assistant account to start receiving guidance rooted in traditional Islamic ethics and leadership texts.",
    robots: "noindex, follow",
    canonicalPath: "/register",
    Component: Register,
  },
  {
    path: "/our-vision",
    outFile: "our-vision/index.html",
    title: "Our Vision — IQRA Assistant",
    description:
      "IQRA Assistant's vision, illustrative three-year growth model, and expansion plan across the Gulf, MENA, and Southeast Asia.",
    robots: "index, follow",
    canonicalPath: "/our-vision",
    Component: OurVision,
  },
];

export function renderRoute(route: PrerenderedRoute) {
  const queryClient = new QueryClient();
  const { Component } = route;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="" ssrPath={route.path}>
          <Component />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

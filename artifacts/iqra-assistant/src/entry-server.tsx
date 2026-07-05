import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Router as WouterRouter } from "wouter";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import OurVision from "@/pages/our-vision";
import Sponsors from "@/pages/sponsors";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
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
  {
    path: "/sponsors",
    outFile: "sponsors/index.html",
    title: "Our Sponsors — IQRA Assistant",
    description:
      "The generous supporters whose donations keep IQRA Assistant free and growing for every seeker of Islamic guidance.",
    robots: "index, follow",
    canonicalPath: "/sponsors",
    Component: Sponsors,
  },
  {
    path: "/terms",
    outFile: "terms/index.html",
    title: "Terms of Service — IQRA Assistant",
    description: "The terms that govern your use of IQRA Assistant.",
    robots: "index, follow",
    canonicalPath: "/terms",
    Component: Terms,
  },
  {
    path: "/privacy",
    outFile: "privacy/index.html",
    title: "Privacy Policy — IQRA Assistant",
    description: "How IQRA Assistant collects, uses, and protects your data.",
    robots: "index, follow",
    canonicalPath: "/privacy",
    Component: Privacy,
  },
  {
    path: "/forgot-password",
    outFile: "forgot-password/index.html",
    title: "Reset Password — IQRA Assistant",
    description: "Request a password reset link for your IQRA Assistant account.",
    robots: "noindex, follow",
    canonicalPath: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password",
    outFile: "reset-password/index.html",
    title: "Set a New Password — IQRA Assistant",
    description: "Choose a new password for your IQRA Assistant account.",
    robots: "noindex, follow",
    canonicalPath: "/reset-password",
    Component: ResetPassword,
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

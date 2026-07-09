import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Landing from "@/pages/landing";
import Chat from "@/pages/chat";
import Donate from "@/pages/donate";
import ThankYou from "@/pages/thank-you";
import AdminDashboard from "@/pages/admin";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Sponsors from "@/pages/sponsors";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import LegalConsent from "@/components/legal-consent";
import InstallPrompt from "@/components/install-prompt";
import DonationPopup from "@/components/donation-popup";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Signed-in users must accept the current legal documents before doing anything else.
  if (!user.legalAccepted) {
    return <LegalConsent />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <Component />;
}

// The root route serves both the public marketing landing page (anonymous,
// indexable) and the authenticated chat app, at the same stable URL ("/").
// The prerendered static HTML shipped for "/" shows the anonymous Landing
// state so crawlers see real content immediately; once the client loads it
// swaps in Chat for signed-in users.
function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user && !user.legalAccepted) {
    return <LegalConsent />;
  }

  return (
    <>
      {user ? <Chat /> : <Landing />}
      <DonationPopup />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/sponsors" component={Sponsors} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      <Route path="/" component={Home} />
      <Route path="/donate">
        {() => <ProtectedRoute component={Donate} />}
      </Route>
      <Route path="/donate/thank-you">
        {() => <ProtectedRoute component={ThankYou} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminDashboard} adminOnly={true} />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
          <InstallPrompt />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

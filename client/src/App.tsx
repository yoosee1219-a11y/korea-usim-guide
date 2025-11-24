import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthToken } from "./lib/api.js";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Compare from "@/pages/compare";
import Tips from "@/pages/tips";
import TipDetail from "@/pages/tip-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/compare" component={Compare} />
      <Route path="/tips" component={Tips} />
      <Route path="/tips/:id" component={TipDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // 앱 초기화 시 토큰 발급
  useEffect(() => {
    getAuthToken().catch((error) => {
      console.error("Failed to initialize auth token:", error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

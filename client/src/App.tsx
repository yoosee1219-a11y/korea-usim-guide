import { Switch, Route } from "wouter";
import { useEffect, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthToken } from "./lib/api.js";
import { Spinner } from "@/components/ui/spinner";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// 페이지 컴포넌트를 동적으로 로드 (코드 스플리팅)
const Home = lazy(() => import("@/pages/home"));
const Compare = lazy(() => import("@/pages/compare"));
const PlanDetail = lazy(() => import("@/pages/plan-detail"));
const Tips = lazy(() => import("@/pages/tips"));
const TipDetail = lazy(() => import("@/pages/tip-detail"));
const AdminLogin = lazy(() => import("@/pages/admin/login"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminPlanList = lazy(() => import("@/pages/admin/plan-list"));
const AdminPlanNew = lazy(() => import("@/pages/admin/plan-new"));
const AdminPlanEdit = lazy(() => import("@/pages/admin/plan-edit"));
const AdminPlansScraper = lazy(() => import("@/pages/admin/plans-scraper"));
const AdminTipsGrouped = lazy(() => import("@/pages/admin/tips-grouped-list"));
const AdminTipEdit = lazy(() => import("@/pages/admin/tip-edit"));
const AdminKeywordList = lazy(() => import("@/pages/admin/keyword-list"));
const AdminContentAutomation = lazy(() => import("@/pages/admin/content-automation"));
const NotFound = lazy(() => import("@/pages/not-found"));

// 로딩 컴포넌트
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="h-12 w-12 text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/compare" component={Compare} />
        <Route path="/plans/:id" component={PlanDetail} />
        <Route path="/tips" component={Tips} />
        <Route path="/tips/:id" component={TipDetail} />

        {/* 관리자 로그인 (보호 없음) */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/plans">
          <ProtectedRoute>
            <AdminPlanList />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/plans/new">
          <ProtectedRoute>
            <AdminPlanNew />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/plans/edit/:id">
          <ProtectedRoute>
            <AdminPlanEdit />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/plans-scraper">
          <ProtectedRoute>
            <AdminPlansScraper />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/tips">
          <ProtectedRoute>
            <AdminTipsGrouped />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/tips/edit/:id">
          <ProtectedRoute>
            <AdminTipEdit />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/tips-grouped">
          <ProtectedRoute>
            <AdminTipsGrouped />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/keywords">
          <ProtectedRoute>
            <AdminKeywordList />
          </ProtectedRoute>
        </Route>
        <Route path="/admin/content-automation">
          <ProtectedRoute>
            <AdminContentAutomation />
          </ProtectedRoute>
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;

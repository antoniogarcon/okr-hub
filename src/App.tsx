import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { 
  ProtectedRoute, 
  RootOnlyRoute, 
  AdminRoute 
} from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TeamLeaderDashboardPage from "./pages/TeamLeaderDashboardPage";
import MemberDashboardPage from "./pages/MemberDashboardPage";
import OKRsPage from "./pages/OKRsPage";
import IndicatorsPage from "./pages/IndicatorsPage";
import TeamsPage from "./pages/TeamsPage";
import TrainPage from "./pages/TrainPage";
import BacklogPage from "./pages/BacklogPage";
import WikiPage from "./pages/WikiPage";
import FeedPage from "./pages/FeedPage";
import ReportsPage from "./pages/ReportsPage";
import AdminPage from "./pages/AdminPage";
import TenantsPage from "./pages/TenantsPage";
import OrganizationalRolesPage from "./pages/OrganizationalRolesPage";
import NotFound from "./pages/NotFound";

// i18n
import "@/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Protected Routes with Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* Member Routes - All authenticated users */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/team-dashboard" element={<TeamLeaderDashboardPage />} />
              <Route path="/my-dashboard" element={<MemberDashboardPage />} />
              <Route path="/okrs" element={<OKRsPage />} />
              <Route path="/indicators" element={<IndicatorsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/train" element={<TrainPage />} />
              <Route path="/backlog" element={<BacklogPage />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route
                path="/reports"
                element={
                  <AdminRoute>
                    <ReportsPage />
                  </AdminRoute>
                }
              />
              
              {/* Admin Routes - admin + root */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/organizational-roles"
                element={
                  <AdminRoute>
                    <OrganizationalRolesPage />
                  </AdminRoute>
                }
              />
              
              {/* Root Only Routes */}
              <Route
                path="/tenants"
                element={
                  <RootOnlyRoute>
                    <TenantsPage />
                  </RootOnlyRoute>
                }
              />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

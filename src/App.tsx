import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import OKRsPage from "./pages/OKRsPage";
import IndicatorsPage from "./pages/IndicatorsPage";
import TeamsPage from "./pages/TeamsPage";
import TrainPage from "./pages/TrainPage";
import BacklogPage from "./pages/BacklogPage";
import WikiPage from "./pages/WikiPage";
import FeedPage from "./pages/FeedPage";
import AdminPage from "./pages/AdminPage";
import TenantsPage from "./pages/TenantsPage";
import NotFound from "./pages/NotFound";

// i18n
import "@/i18n";

const queryClient = new QueryClient();

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/okrs" element={<OKRsPage />} />
              <Route path="/indicators" element={<IndicatorsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/train" element={<TrainPage />} />
              <Route path="/backlog" element={<BacklogPage />} />
              <Route path="/wiki" element={<WikiPage />} />
              <Route path="/feed" element={<FeedPage />} />
              
              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Root Only Routes */}
              <Route
                path="/tenants"
                element={
                  <ProtectedRoute allowedRoles={['root']}>
                    <TenantsPage />
                  </ProtectedRoute>
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

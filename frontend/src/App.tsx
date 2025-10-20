import { Toaster } from "@/components/ui/sonner";
import { useGetUserInfoQuery } from "../Redux/Api/authApi/Auth";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TradingProvider } from "@/contexts/TradingContext";
import { StockStreamProvider } from "@/contexts/StockStreamContext";
import { Layout } from "@/components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Trading from "./pages/Trading";
import Portfolio from "./pages/Portfolio";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import HomePage from "./pages/HomePage";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  // Always fetch user info at the app level
  const { isLoading } = useGetUserInfoQuery(undefined);

  if (isLoading) {
    // You can customize this loader as you wish
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-48 rounded-xl" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <StockStreamProvider>
          <TradingProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/trading"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Trading />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Portfolio />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Analytics />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <div className="text-center py-12">
                          <h2 className="text-2xl font-bold">Settings</h2>
                          <p className="text-gray-600 mt-2">
                            Settings page coming soon...
                          </p>
                        </div>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TradingProvider>
        </StockStreamProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

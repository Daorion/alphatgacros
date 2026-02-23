import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUserForm from "./pages/AdminUserForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoginRedirect = () => {
  const { user, userRole, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Login />;
  if (userRole === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/cliente" replace />;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginRedirect />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/cliente"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios/novo"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUserForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminUserForm />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

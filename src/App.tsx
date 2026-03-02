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
import AdminLayout from "./components/AdminLayout";
import AdminOverview from "./pages/AdminOverview";
import AdminUsers from "./pages/AdminUsers";
import AdminUserForm from "./pages/AdminUserForm";
import AdminWorkouts from "./pages/AdminWorkouts";
import AdminWorkoutForm from "./pages/AdminWorkoutForm";
import AdminImportWorkouts from "./pages/AdminImportWorkouts";
import AdminInsights from "./pages/AdminInsights";
import AdminRelatorios from "./pages/AdminRelatorios";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminProfile from "./pages/AdminProfile";
import AdminFinanceiro from "./pages/AdminFinanceiro";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LoginRedirect = () => {
  const { user, userRole, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
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
              {/* Admin routes with shared layout */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="usuarios/novo" element={<AdminUserForm />} />
                <Route path="usuarios/:id" element={<AdminUserForm />} />
                <Route path="treinos" element={<AdminWorkouts />} />
                <Route path="treinos/novo" element={<AdminWorkoutForm />} />
                <Route path="treinos/:id" element={<AdminWorkoutForm />} />
                <Route path="treinos/importar" element={<AdminImportWorkouts />} />
                <Route path="financeiro" element={<AdminFinanceiro />} />
                <Route path="insights" element={<AdminInsights />} />
                <Route path="relatorios" element={<AdminRelatorios />} />
                <Route path="auditoria" element={<AdminAuditLogs />} />
                <Route path="perfil" element={<AdminProfile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

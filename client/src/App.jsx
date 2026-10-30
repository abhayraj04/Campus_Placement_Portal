 import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const StudentDashboard = lazy(() => import("./pages/dashboards/StudentDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const CompanyDashboard = lazy(() => import("./pages/dashboards/CompanyDashboard"));
const AuthenticatedHome = lazy(() => import("./pages/AuthenticatedHome"));

import ConnectionStatus from "./components/ConnectionStatus";
import AICareerCopilot from "./components/AICareerCopilot";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/dashboard"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <CompanyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'company']}>
            <AuthenticatedHome />
          </ProtectedRoute>
        }
      />

      {/* Backward compatibility redirects */}
      <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <ConnectionStatus />
          <AICareerCopilot />
          <Suspense fallback={<div className="loading-spinner">Loading…</div>}>
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;

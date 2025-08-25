import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../contexts/AuthContext.tsx';
import { ThemeProvider } from '../contexts/ThemeContext.tsx';
import Layout from './components/Layout.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Settings from './pages/Settings.tsx';
import Reports from './pages/Reports.tsx';
import Calendar from './pages/Calendar.tsx';
import { ReportGenerator } from './components/ReportGenerator.tsx';
import { Auth } from '../pages/Auth.tsx';
import { VerifyEmail } from '../pages/VerifyEmail.tsx';
import Profile from './pages/Profile.tsx';
import routerConfig from './router-config.ts';

// Создаем QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Компонент для защищенных маршрутов
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  console.log('🔍 AppRoutes: Компонент начал рендериться');
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();
  console.log('🔍 AppRoutes: useAuth() успешно вызван, user:', user);

  return (
    <Routes>
      {/* Маршрут верификации email доступен всегда */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      
      {user ? (
        <>
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
                {/* Toast уведомления только для защищенных страниц */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    className: 'modern-toast',
                    duration: 5000,
                  }}
                />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
                {/* Toast уведомления только для защищенных страниц */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    className: 'modern-toast',
                    duration: 5000,
                  }}
                />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute>
              <Layout>
                <Reports />
                {/* Toast уведомления только для защищенных страниц */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    className: 'modern-toast',
                    duration: 5000,
                  }}
                />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Layout>
                <Calendar />
                {/* Toast уведомления только для защищенных страниц */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    className: 'modern-toast',
                    duration: 5000,
                  }}
                />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
                {/* Toast уведомления только для защищенных страниц */}
                <Toaster 
                  position="top-right"
                  toastOptions={{
                    className: 'modern-toast',
                    duration: 5000,
                  }}
                />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/auth" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  console.log('🔍 App: Компонент начал рендериться');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router future={routerConfig.future}>
            <AppRoutes />
            
            {/* CSS для анимаций */}
            <style>{`
              .modern-toast {
                animation: slideInRight 0.3s ease-out;
              }
              
              @keyframes slideInRight {
                from {
                  transform: translateX(100%);
                  opacity: 0;
                }
                to {
                  transform: translateX(0);
                  opacity: 1;
                }
              }
              
              .modern-toast:hover {
                transform: translateY(-2px);
                transition: transform 0.2s ease;
              }
              
              /* Кастомные стили для react-hot-toast */
              .react-hot-toast > div {
                animation: none !important;
              }
              
              .react-hot-toast > div > div {
                animation: none !important;
              }
            `}</style>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 
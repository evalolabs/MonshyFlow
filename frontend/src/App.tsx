import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkflowEditorPage } from './pages/WorkflowEditorPage';
import { WebhookTestPage } from './pages/WebhookTestPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SecretsManagementPage } from './pages/SecretsManagementPage';
import { TenantManagementPage } from './pages/TenantManagementPage';
import { ApiKeysManagementPage } from './pages/ApiKeysManagementPage';
import { NavigationWrapper } from './components/Navigation/NavigationWrapper';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { initializeAutoDiscovery } from './components/WorkflowBuilder/nodeRegistry/autoDiscovery';
import { loadApiIntegrations } from './config/apiIntegrations';

function App() {
  // Initialize auto-discovery and API integrations on app startup
  useEffect(() => {
    initializeAutoDiscovery().catch(err => {
      console.error('[App] Failed to initialize auto-discovery:', err);
    });
    loadApiIntegrations().catch(err => {
      console.error('[App] Failed to load API integrations:', err);
    });
  }, []);
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <div className="flex min-h-screen">
                <NavigationWrapper />
                <main className="flex-1 navigation-content min-h-screen">
                  <Routes>
                    <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/secrets" element={<ProtectedRoute><SecretsManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/apikeys" element={<ProtectedRoute><ApiKeysManagementPage /></ProtectedRoute>} />
                    <Route path="/admin/tenants" element={<ProtectedRoute><TenantManagementPage /></ProtectedRoute>} />
                    <Route path="/workflow/:id" element={<ProtectedRoute><WorkflowEditorPage /></ProtectedRoute>} />
                    <Route path="/webhook-test/:workflowId" element={<ProtectedRoute><WebhookTestPage /></ProtectedRoute>} />
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

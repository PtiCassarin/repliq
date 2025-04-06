import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import NewRequest from './components/NewRequest';
import RequestsList from './components/RequestsList';
import Library from './components/Library';
import Auth from './components/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';

function AuthWrapper() {
  const { login } = useAuth();
  return <Auth onLogin={login} />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <main className="container mx-auto py-6">
            <Routes>
              <Route path="/login" element={<AuthWrapper />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/new-request" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-request"
                element={
                  <ProtectedRoute requiredRole="client">
                    <NewRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <RequestsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/library"
                element={
                  <ProtectedRoute requiredRole="client">
                    <Library />
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
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

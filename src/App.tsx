import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import OrderRegistration from './components/OrderRegistration';
import OrdersList from './components/OrdersList';
import ProfileSection from './components/ProfileSection';
import Login from './components/Login';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Layout>
                <Clients />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <OrderRegistration />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders-list"
          element={
            <ProtectedRoute>
              <Layout>
                <OrdersList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfileSection />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
// 1. You MUST import the new file at the top
import PaymentSummary from './pages/PaymentSummary'; // (Adjust the path if you put it in a different folder)

function App() {
  return (
    <Router>
      {/* Your Sidebar/Navigation component goes here */}
      <nav>
        {/* ... your existing links ... */}
        {/* 2. You MUST add a button or link so you can click it */}
        <Link to="/payment-summary">Payment Summary</Link>
      </nav>

      <Routes>
        {/* ... your existing routes ... */}
        {/* 3. You MUST tell React what to load when the URL changes */}
        <Route path="/payment-summary" element={<PaymentSummary />} />
      </Routes>
    </Router>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Dashboard from './components/Dashboard';
import ApplicantPortal from './components/ApplicantPortal';
import SuccessPage from './components/SuccessPage';
import ReportView from './components/ReportView';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Billing from './pages/Billing';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCanceled from './pages/PaymentCanceled';
import './App.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function App() {
  return (
    <Router>
      <div className="App">
        <Elements stripe={stripePromise}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/check/success" element={<SuccessPage />} />
          <Route path="/check/:token" element={<ApplicantPortal />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/report/:applicantId" element={<ReportView />} />
            <Route path="/billing" element={<Billing />} />
          </Route>
          <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
          <Route path="/payment-canceled" element={<ProtectedRoute><PaymentCanceled /></ProtectedRoute>} />
        </Routes>
        </Elements>
      </div>
    </Router>
  );
}

export default App;

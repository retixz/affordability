import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ApplicantPortal from './components/ApplicantPortal';
import SuccessPage from './components/SuccessPage';
import ReportView from './components/ReportView';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/check/success" element={<SuccessPage />} />
          <Route path="/check/:token" element={<ApplicantPortal />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report/:applicantId" element={<ReportView />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;

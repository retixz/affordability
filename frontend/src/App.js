import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ApplicantPortal from './components/ApplicantPortal';
import SuccessPage from './components/SuccessPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/check/success" element={<SuccessPage />} />
          <Route path="/check/:token" element={<ApplicantPortal />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

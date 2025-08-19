import React, { useState } from 'react';
import NewCheckModal from './NewCheckModal';
import './Dashboard.css';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Landlord Dashboard</h1>
        <button className="new-check-button" onClick={handleOpenModal}>
          + New Affordability Check
        </button>
      </header>
      <main className="dashboard-main">
        {/* The rest of the dashboard content would go here */}
        <p>Welcome to your dashboard. Manage your properties and applicant checks here.</p>
      </main>
      {isModalOpen && <NewCheckModal onClose={handleCloseModal} />}
    </div>
  );
};

export default Dashboard;

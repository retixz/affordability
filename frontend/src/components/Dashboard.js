import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import NewCheckModal from './NewCheckModal';
import './Dashboard.css';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for applicants
  const mockApplicants = [
    { id: 1, fullName: 'John Doe', status: 'complete' },
    { id: 2, fullName: 'Jane Smith', status: 'pending' },
    { id: 3, fullName: 'Peter Jones', status: 'in_progress' },
    { id: 4, fullName: 'Mary Williams', status: 'expired' },
  ];

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
        <h2>Applicant Status</h2>
        <table className="applicant-table">
          <thead>
            <tr>
              <th>Applicant Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {mockApplicants.map(applicant => (
              <tr key={applicant.id}>
                <td>{applicant.fullName}</td>
                <td>
                  <span className={`status status-${applicant.status}`}>
                    {applicant.status}
                  </span>
                </td>
                <td>
                  {applicant.status === 'complete' ? (
                    <Link to={`/report/${applicant.id}`} className="view-report-button">
                      View Report
                    </Link>
                  ) : (
                    <button className="view-report-button" disabled>
                      View Report
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      {isModalOpen && <NewCheckModal onClose={handleCloseModal} />}
    </div>
  );
};

export default Dashboard;

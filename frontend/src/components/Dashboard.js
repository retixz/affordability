import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewCheckModal from './NewCheckModal';
import { getApplicants } from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const { data } = await getApplicants();
        setApplicants(data);
      } catch (error) {
        console.error('Failed to fetch applicants:', error);
        // If unauthorized, redirect to login
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          navigate('/login');
        }
      }
    };

    fetchApplicants();
  }, [navigate]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Landlord Dashboard</h1>
        <div>
          <button className="new-check-button" onClick={handleOpenModal}>
            + New Affordability Check
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
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
            {applicants.map(applicant => (
              <tr key={applicant.id}>
                <td>{applicant.full_name}</td>
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

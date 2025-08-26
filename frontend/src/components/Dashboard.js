import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NewCheckModal from './NewCheckModal';
import Pagination from './Pagination';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const params = {
          page: currentPage,
          limit: 10,
          search: searchQuery,
          status: selectedStatus,
        };
        const { data } = await api.get('/applicants', { params });
        setApplicants(data.applicants);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error('Failed to fetch applicants:', error);
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          navigate('/login');
        }
      }
    };

    fetchApplicants();
  }, [searchQuery, selectedStatus, currentPage, navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

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
        <div className="filters">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="complete">Complete</option>
          </select>
        </div>
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
        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={10}
          onPageChange={setCurrentPage}
        />
      </main>
      {isModalOpen && <NewCheckModal onClose={handleCloseModal} />}
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ApplicantPortal.css';

const ApplicantPortal = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        // In a real app, the base URL would come from an environment variable
        const response = await axios.get(`http://localhost:4000/checks/${token}`);
        setData(response.data);
      } catch (err) {
        setError('This link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  if (loading) {
    return <div className="portal-container"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="portal-container"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="portal-container">
      <div className="portal-header">
        <h1>{data.company_name} has requested an affordability check.</h1>
      </div>
      <div className="portal-body">
        <p>
          To help them assess your application, we need to securely connect to your bank account
          and retrieve your income and expenditure information for the last 12 months.
        </p>
        <p>
          This is a read-only process, and we will not store your bank credentials.
          The information is used solely for the purpose of creating an affordability report for {data.company_name}.
        </p>
      </div>
      <div className="portal-footer">
        <button className="start-check-button">Start Secure Check</button>
      </div>
    </div>
  );
};

export default ApplicantPortal;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const TinkCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleReportsCallback = async () => {
        const queryParams = new URLSearchParams(location.search);
        const income_check_id = queryParams.get('income_check_id');
        const expense_check_id = queryParams.get('expense_check_id');
        const state = queryParams.get('state');

        if (income_check_id && expense_check_id && state) {
            try {
                await api.post('/process-reports', { income_check_id, expense_check_id, state });
                navigate('/check/success');
            } catch (error) {
                setError("Failed to process affordability reports.");
                setLoading(false);
            }
        } else {
            const error = queryParams.get('error');
            const message = queryParams.get('message');
            if (error) {
                setError(`An error occurred: ${error} - ${message}`);
            } else {
                setError('Invalid callback parameters.');
            }
            setLoading(false);
        }
    };
    handleReportsCallback();
  }, [location, navigate]);

  if (loading) {
    return <div className="portal-container"><p>Processing your secure check...</p></div>;
  }

  if (error) {
    return <div className="portal-container"><p className="error-message">{error}</p></div>;
  }

  return null;
};

export default TinkCallback;

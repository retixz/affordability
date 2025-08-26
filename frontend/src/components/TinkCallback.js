import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const TinkCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const processTinkCallback = async () => {
      const queryParams = new URLSearchParams(location.search);
      const code = queryParams.get('code');
      const state = queryParams.get('state');

      if (!code || !state) {
        setError('Invalid callback parameters.');
        setLoading(false);
        return;
      }

      try {
        await api.get(`/callback/tink?code=${code}&state=${state}`);
        navigate('/check/success');
      } catch (err) {
        setError('Failed to complete the secure check. Please try again.');
        setLoading(false);
      }
    };

    processTinkCallback();
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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PaymentSuccess = () => {
    const [status, setStatus] = useState('pending');
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const statusRef = useRef(status);
    statusRef.current = status;

    useEffect(() => {
        const pollStatus = async () => {
            try {
                const response = await api.get('/account/status');
                if (response.data.status === 'active') {
                    setStatus('active');
                }
            } catch (err) {
                console.error('Error fetching account status:', err);
            }
        };

        const intervalId = setInterval(pollStatus, 3000);
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            if (statusRef.current !== 'active') {
                setError('Activation is taking longer than expected. Please contact support.');
            }
        }, 30000); // 30 seconds

        // Initial check
        pollStatus();

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        if (status === 'active') {
            navigate('/dashboard');
        }
    }, [status, navigate]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                <div className="p-10 bg-white rounded-lg shadow-md text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <a href="/support" className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                        Contact Support
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="p-10 bg-white rounded-lg shadow-md text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful!</h1>
                <p className="text-gray-700">Thank you for your payment! We are activating your account now. This will only take a moment...</p>
            </div>
        </div>
    );
};

export default PaymentSuccess;
